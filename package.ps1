# Bilibili Video Transcript Extension Package Tool
Write-Host "========================================" -ForegroundColor Green
Write-Host "Bilibili Video Transcript Package Tool" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check required files
Write-Host "Checking required files..." -ForegroundColor Yellow
$requiredFiles = @("manifest.json", "content.js", "background.js", "options.html", "options.js", "icon.svg")

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "Error: Cannot find $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "All required files checked successfully!" -ForegroundColor Green
Write-Host ""

# Create package directory
$PACKAGE_DIR = "dist"
if (Test-Path $PACKAGE_DIR) {
    Write-Host "Cleaning old package directory..." -ForegroundColor Yellow
    Remove-Item -Path $PACKAGE_DIR -Recurse -Force
}

Write-Host "Creating package directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $PACKAGE_DIR | Out-Null

# Copy required files
Write-Host "Copying extension files..." -ForegroundColor Yellow
Copy-Item "manifest.json" $PACKAGE_DIR
Copy-Item "content.js" $PACKAGE_DIR
Copy-Item "background.js" $PACKAGE_DIR
Copy-Item "options.html" $PACKAGE_DIR
Copy-Item "options.js" $PACKAGE_DIR
Copy-Item "icon.svg" $PACKAGE_DIR

# Copy localization files
if (Test-Path "_locales") {
    Write-Host "Copying localization files..." -ForegroundColor Yellow
    Copy-Item "_locales" $PACKAGE_DIR -Recurse
}

# Copy documentation files
Write-Host "Copying documentation files..." -ForegroundColor Yellow
Copy-Item "README.md" $PACKAGE_DIR
Copy-Item "LICENSE" $PACKAGE_DIR
Copy-Item "Demo.png" $PACKAGE_DIR

# Create ZIP file
Write-Host "Creating ZIP archive..." -ForegroundColor Yellow

# Get version from manifest.json
try {
    $manifest = Get-Content "manifest.json" -Raw -Encoding UTF8 | ConvertFrom-Json
    $version = $manifest.version
    if (-not $version) {
        throw "Version not found in manifest.json"
    }
} catch {
    Write-Host "Error reading version from manifest.json: $_" -ForegroundColor Red
    exit 1
}

$zipPath = "bilibili-video-transcript-v$version.zip"

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path "$PACKAGE_DIR\*" -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Package completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Package files location:" -ForegroundColor Cyan
Write-Host "- Extension directory: $PACKAGE_DIR\" -ForegroundColor White
Write-Host "- ZIP archive: $zipPath" -ForegroundColor White
Write-Host ""
Write-Host "Installation instructions:" -ForegroundColor Cyan
Write-Host "1. Open Chrome browser" -ForegroundColor White
Write-Host "2. Go to chrome://extensions/" -ForegroundColor White
Write-Host "3. Enable Developer mode" -ForegroundColor White
Write-Host "4. Click 'Load unpacked extension'" -ForegroundColor White
Write-Host "5. Select the $PACKAGE_DIR folder" -ForegroundColor White
Write-Host "" 