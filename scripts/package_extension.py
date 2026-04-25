from __future__ import annotations

import argparse
import json
import pathlib
import shutil
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent


def load_manifest() -> dict:
    with (ROOT / 'manifest.json').open('r', encoding='utf-8-sig') as handle:
        return json.load(handle)


def add_file_or_glob(entry: str, paths: set[str], missing: list[str]) -> None:
    normalized = pathlib.PurePosixPath(entry).as_posix()
    if any(char in normalized for char in '*?[]'):
        matches = list(ROOT.glob(normalized))
        if not matches:
            missing.append(normalized)
            return
        for match in matches:
            paths.add(match.relative_to(ROOT).as_posix())
        return

    target = ROOT / normalized
    if not target.exists():
        missing.append(normalized)
        return

    paths.add(normalized)


def add_icon_entry(value: object, paths: set[str], missing: list[str]) -> None:
    if isinstance(value, str):
        add_file_or_glob(value, paths, missing)
        return

    if isinstance(value, dict):
        for item in value.values():
            if isinstance(item, str):
                add_file_or_glob(item, paths, missing)


def collect_paths(manifest: dict) -> list[str]:
    paths: set[str] = {'manifest.json'}
    missing: list[str] = []

    if (ROOT / '_locales').exists():
        paths.add('_locales')

    background = manifest.get('background')
    if isinstance(background, dict):
        service_worker = background.get('service_worker')
        if isinstance(service_worker, str):
            add_file_or_glob(service_worker, paths, missing)

        background_page = background.get('page')
        if isinstance(background_page, str):
            add_file_or_glob(background_page, paths, missing)

        for script in background.get('scripts', []) or []:
            if isinstance(script, str):
                add_file_or_glob(script, paths, missing)

    for content_script in manifest.get('content_scripts', []) or []:
        if not isinstance(content_script, dict):
            continue
        for key in ('js', 'css'):
            for item in content_script.get(key, []) or []:
                if isinstance(item, str):
                    add_file_or_glob(item, paths, missing)

    add_icon_entry(manifest.get('icons'), paths, missing)

    for key in ('action', 'browser_action', 'page_action'):
        entry = manifest.get(key)
        if not isinstance(entry, dict):
            continue

        add_icon_entry(entry.get('default_icon'), paths, missing)

        default_popup = entry.get('default_popup')
        if isinstance(default_popup, str):
            add_file_or_glob(default_popup, paths, missing)

    options_ui = manifest.get('options_ui')
    if isinstance(options_ui, dict):
        page = options_ui.get('page')
        if isinstance(page, str):
            add_file_or_glob(page, paths, missing)

    for key in ('options_page', 'devtools_page'):
        value = manifest.get(key)
        if isinstance(value, str):
            add_file_or_glob(value, paths, missing)

    side_panel = manifest.get('side_panel')
    if isinstance(side_panel, dict):
        default_path = side_panel.get('default_path')
        if isinstance(default_path, str):
            add_file_or_glob(default_path, paths, missing)

    chrome_overrides = manifest.get('chrome_url_overrides')
    if isinstance(chrome_overrides, dict):
        for value in chrome_overrides.values():
            if isinstance(value, str):
                add_file_or_glob(value, paths, missing)

    sandbox = manifest.get('sandbox')
    if isinstance(sandbox, dict):
        for page in sandbox.get('pages', []) or []:
            if isinstance(page, str):
                add_file_or_glob(page, paths, missing)

    for resource_group in manifest.get('web_accessible_resources', []) or []:
        if not isinstance(resource_group, dict):
            continue
        for resource in resource_group.get('resources', []) or []:
            if isinstance(resource, str):
                add_file_or_glob(resource, paths, missing)

    if missing:
        formatted = '\n'.join(f'- {entry}' for entry in sorted(set(missing)))
        raise FileNotFoundError(f'Manifest referenced files were not found:\n{formatted}')

    return sorted(paths)


def copy_path(relative_path: str, destination_root: pathlib.Path) -> None:
    source = ROOT / relative_path
    destination = destination_root / relative_path

    if source.is_dir():
        shutil.copytree(source, destination, dirs_exist_ok=True)
        return

    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def apply_production_config(package_dir: pathlib.Path) -> None:
    logger_path = package_dir / 'logger.js'
    if not logger_path.exists():
        return

    content = logger_path.read_text(encoding='utf-8')
    content = content.replace(
        'window.BilibiliSubtitle.CURRENT_LOG_LEVEL = window.BilibiliSubtitle.LogLevel.DEBUG',
        'window.BilibiliSubtitle.CURRENT_LOG_LEVEL = window.BilibiliSubtitle.LogLevel.WARN',
    )
    logger_path.write_text(content, encoding='utf-8')
    print('Applied production log level (DEBUG -> WARN)')


def create_package(dist_dir: pathlib.Path, package_name: str) -> tuple[pathlib.Path, pathlib.Path]:
    manifest = load_manifest()
    version = manifest['version']
    package_dir = dist_dir / f'{package_name}-{version}'
    zip_path = dist_dir / f'{package_name}-{version}.zip'

    if package_dir.exists():
        shutil.rmtree(package_dir)
    if zip_path.exists():
        zip_path.unlink()

    dist_dir.mkdir(parents=True, exist_ok=True)

    for relative_path in collect_paths(manifest):
        copy_path(relative_path, package_dir)

    apply_production_config(package_dir)

    with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for file_path in sorted(package_dir.rglob('*')):
            if file_path.is_file():
                archive.write(file_path, file_path.relative_to(package_dir))

    return package_dir, zip_path


def main() -> int:
    parser = argparse.ArgumentParser(description='Package the browser extension for GitHub Releases.')
    parser.add_argument('--dist-dir', default='dist')
    parser.add_argument('--package-name', default='bilibili-video-transcript')
    args = parser.parse_args()

    dist_dir = ROOT / args.dist_dir
    package_dir, zip_path = create_package(dist_dir=dist_dir, package_name=args.package_name)
    print(f'Package directory: {package_dir}')
    print(f'Zip archive: {zip_path}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
