from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import re
import shutil
import sys
import zipfile


ROOT = pathlib.Path(__file__).resolve().parent.parent
BANNED_PERMISSIONS = {
    'webRequest',
    'activeTab',
    'tabs',
    'webNavigation',
    'scripting',
}
PRODUCTION_LOG_LEVEL = 'window.BilibiliSubtitle.LogLevel.WARN'


def load_manifest() -> dict:
    manifest_path = ROOT / 'manifest.json'
    with manifest_path.open('r', encoding='utf-8-sig') as handle:
        return json.load(handle)


def normalize_manifest_path(entry: str) -> str:
    normalized = pathlib.PurePosixPath(entry).as_posix()
    if not normalized or normalized.startswith('/') or normalized == '..' or normalized.startswith('../'):
        raise ValueError(f'Manifest path is outside the project: {entry!r}')
    return normalized


def add_file_or_glob(entry: str, paths: set[str], missing: list[str]) -> None:
    normalized = normalize_manifest_path(entry)
    if any(char in normalized for char in '*?[]'):
        matches = sorted(ROOT.glob(normalized))
        if not matches:
            missing.append(normalized)
            return
        for match in matches:
            if match.is_file():
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
    elif isinstance(value, dict):
        for item in value.values():
            if isinstance(item, str):
                add_file_or_glob(item, paths, missing)


def collect_manifest_paths(manifest: dict) -> list[str]:
    paths: set[str] = {'manifest.json', 'LICENSE'}
    missing: list[str] = []

    if manifest.get('default_locale'):
        locales_dir = ROOT / '_locales'
        if not locales_dir.is_dir():
            missing.append('_locales')
        else:
            paths.add('_locales')

    background = manifest.get('background')
    if isinstance(background, dict):
        for key in ('service_worker', 'page'):
            value = background.get(key)
            if isinstance(value, str):
                add_file_or_glob(value, paths, missing)
        for value in background.get('scripts', []) or []:
            if isinstance(value, str):
                add_file_or_glob(value, paths, missing)

    for content_script in manifest.get('content_scripts', []) or []:
        if not isinstance(content_script, dict):
            continue
        for key in ('js', 'css'):
            for value in content_script.get(key, []) or []:
                if isinstance(value, str):
                    add_file_or_glob(value, paths, missing)

    add_icon_entry(manifest.get('icons'), paths, missing)

    for key in ('action', 'browser_action', 'page_action'):
        entry = manifest.get(key)
        if not isinstance(entry, dict):
            continue
        add_icon_entry(entry.get('default_icon'), paths, missing)
        popup = entry.get('default_popup')
        if isinstance(popup, str):
            add_file_or_glob(popup, paths, missing)

    options_ui = manifest.get('options_ui')
    if isinstance(options_ui, dict) and isinstance(options_ui.get('page'), str):
        add_file_or_glob(options_ui['page'], paths, missing)

    for key in ('options_page', 'devtools_page'):
        if isinstance(manifest.get(key), str):
            add_file_or_glob(manifest[key], paths, missing)

    side_panel = manifest.get('side_panel')
    if isinstance(side_panel, dict) and isinstance(side_panel.get('default_path'), str):
        add_file_or_glob(side_panel['default_path'], paths, missing)

    chrome_overrides = manifest.get('chrome_url_overrides')
    if isinstance(chrome_overrides, dict):
        for value in chrome_overrides.values():
            if isinstance(value, str):
                add_file_or_glob(value, paths, missing)

    sandbox = manifest.get('sandbox')
    if isinstance(sandbox, dict):
        for value in sandbox.get('pages', []) or []:
            if isinstance(value, str):
                add_file_or_glob(value, paths, missing)

    for group in manifest.get('web_accessible_resources', []) or []:
        if not isinstance(group, dict):
            continue
        for value in group.get('resources', []) or []:
            if isinstance(value, str):
                add_file_or_glob(value, paths, missing)

    if missing:
        formatted = '\n'.join(f'- {entry}' for entry in sorted(set(missing)))
        raise FileNotFoundError(f'Manifest referenced files were not found:\n{formatted}')

    return sorted(paths)


def validate_manifest(manifest: dict) -> None:
    permissions = set(manifest.get('permissions', []) or [])
    host_permissions = set(manifest.get('host_permissions', []) or [])
    unexpected_permissions = sorted(permissions & BANNED_PERMISSIONS)
    if unexpected_permissions:
        raise ValueError(f'Forbidden permissions remain: {", ".join(unexpected_permissions)}')
    if '<all_urls>' in host_permissions:
        raise ValueError('The broad <all_urls> host permission must not be packaged')

    version = manifest.get('version')
    if not isinstance(version, str) or not re.fullmatch(r'\d+(?:\.\d+){0,3}', version):
        raise ValueError(f'Invalid extension version: {version!r}')


def copy_path(relative_path: str, package_dir: pathlib.Path) -> None:
    source = ROOT / relative_path
    destination = package_dir / relative_path
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
    pattern = r'window\.BilibiliSubtitle\.CURRENT_LOG_LEVEL\s*=\s*[^\r\n]+'
    updated, replacements = re.subn(
        pattern,
        f'window.BilibiliSubtitle.CURRENT_LOG_LEVEL = {PRODUCTION_LOG_LEVEL}',
        content,
        count=1,
    )
    if replacements != 1:
        raise ValueError('logger.js does not contain exactly one current log level assignment')
    logger_path.write_text(updated, encoding='utf-8', newline='\n')


def validate_package(package_dir: pathlib.Path, paths: list[str]) -> None:
    for relative_path in paths:
        if not (package_dir / relative_path).exists():
            raise FileNotFoundError(f'Packaged file is missing: {relative_path}')

    packaged_manifest = load_json(package_dir / 'manifest.json')
    validate_manifest(packaged_manifest)

    logger_path = package_dir / 'logger.js'
    if logger_path.exists():
        logger = logger_path.read_text(encoding='utf-8')
        if PRODUCTION_LOG_LEVEL not in logger:
            raise ValueError('Packaged logger is not configured for production')


def load_json(path: pathlib.Path) -> dict:
    with path.open('r', encoding='utf-8-sig') as handle:
        return json.load(handle)


def write_zip(package_dir: pathlib.Path, zip_path: pathlib.Path) -> None:
    with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for file_path in sorted(package_dir.rglob('*')):
            if not file_path.is_file():
                continue
            relative_path = file_path.relative_to(package_dir).as_posix()
            info = zipfile.ZipInfo(relative_path)
            info.date_time = (1980, 1, 1, 0, 0, 0)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, file_path.read_bytes())


def sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def create_release(dist_dir: pathlib.Path, package_name: str) -> tuple[pathlib.Path, pathlib.Path, pathlib.Path]:
    manifest = load_manifest()
    validate_manifest(manifest)
    version = manifest['version']
    paths = collect_manifest_paths(manifest)

    package_dir = dist_dir / f'{package_name}-{version}'
    zip_path = dist_dir / f'{package_name}-{version}.zip'
    checksum_path = dist_dir / f'{package_name}-{version}.zip.sha256'

    dist_dir.mkdir(parents=True, exist_ok=True)
    for path in (package_dir, zip_path, checksum_path):
        if path.is_dir():
            shutil.rmtree(path)
        elif path.exists():
            path.unlink()

    for relative_path in paths:
        copy_path(relative_path, package_dir)
    apply_production_config(package_dir)
    validate_package(package_dir, paths)
    write_zip(package_dir, zip_path)

    digest = sha256(zip_path)
    checksum_path.write_text(f'{digest}  {zip_path.name}\n', encoding='utf-8', newline='\n')
    return package_dir, zip_path, checksum_path


def main() -> int:
    parser = argparse.ArgumentParser(description='Build a validated Chrome extension release package.')
    parser.add_argument('--dist-dir', default='dist')
    parser.add_argument('--package-name', default='bilibili-video-transcript')
    args = parser.parse_args()

    dist_dir = (ROOT / args.dist_dir).resolve()
    package_dir, zip_path, checksum_path = create_release(dist_dir, args.package_name)
    print(f'Package directory: {package_dir}')
    print(f'Zip archive: {zip_path}')
    print(f'SHA-256: {sha256(zip_path)}')
    print(f'Checksum file: {checksum_path}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
