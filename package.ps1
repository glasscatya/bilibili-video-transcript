Write-Host "========================================" -ForegroundColor Green
Write-Host "Bilibili视频字幕插件打包工具" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 检查必要文件是否存在
Write-Host "检查必要文件..." -ForegroundColor Yellow
$requiredFiles = @("manifest.json", "content.js", "background.js", "options.html", "options.js", "icon.svg")

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "错误：找不到 $file 文件" -ForegroundColor Red
        exit 1
    }
}

Write-Host "所有必要文件检查完成！" -ForegroundColor Green
Write-Host ""

# 创建打包目录
$PACKAGE_DIR = "dist"
if (Test-Path $PACKAGE_DIR) {
    Write-Host "清理旧的打包目录..." -ForegroundColor Yellow
    Remove-Item -Path $PACKAGE_DIR -Recurse -Force
}

Write-Host "创建打包目录..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $PACKAGE_DIR | Out-Null

# 复制必要文件
Write-Host "复制插件文件..." -ForegroundColor Yellow
Copy-Item "manifest.json" $PACKAGE_DIR
Copy-Item "content.js" $PACKAGE_DIR
Copy-Item "background.js" $PACKAGE_DIR
Copy-Item "options.html" $PACKAGE_DIR
Copy-Item "options.js" $PACKAGE_DIR
Copy-Item "icon.svg" $PACKAGE_DIR

# 复制本地化文件
if (Test-Path "_locales") {
    Write-Host "复制本地化文件..." -ForegroundColor Yellow
    Copy-Item "_locales" $PACKAGE_DIR -Recurse
}

# 复制文档文件
Write-Host "复制文档文件..." -ForegroundColor Yellow
Copy-Item "README.md" $PACKAGE_DIR
Copy-Item "LICENSE" $PACKAGE_DIR
Copy-Item "Demo.png" $PACKAGE_DIR

# 创建ZIP文件
Write-Host "创建ZIP压缩包..." -ForegroundColor Yellow
$zipPath = "bilibili-video-transcript-v1.1.0.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path "$PACKAGE_DIR\*" -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "打包完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "打包文件位置：" -ForegroundColor Cyan
Write-Host "- 插件目录：$PACKAGE_DIR\" -ForegroundColor White
Write-Host "- ZIP压缩包：$zipPath" -ForegroundColor White
Write-Host ""
Write-Host "安装说明：" -ForegroundColor Cyan
Write-Host "1. 打开Chrome浏览器" -ForegroundColor White
Write-Host "2. 访问 chrome://extensions/" -ForegroundColor White
Write-Host "3. 开启开发者模式" -ForegroundColor White
Write-Host "4. 点击加载已解压的扩展程序" -ForegroundColor White
Write-Host "5. 选择 $PACKAGE_DIR 文件夹" -ForegroundColor White
Write-Host "" 