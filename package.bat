@echo off
echo ========================================
echo Bilibili视频字幕插件打包工具
echo ========================================
echo.

:: 检查必要文件是否存在
echo 检查必要文件...
if not exist "manifest.json" (
    echo 错误：找不到 manifest.json 文件
    pause
    exit /b 1
)

if not exist "content.js" (
    echo 错误：找不到 content.js 文件
    pause
    exit /b 1
)

if not exist "background.js" (
    echo 错误：找不到 background.js 文件
    pause
    exit /b 1
)

if not exist "options.html" (
    echo 错误：找不到 options.html 文件
    pause
    exit /b 1
)

if not exist "options.js" (
    echo 错误：找不到 options.js 文件
    pause
    exit /b 1
)

if not exist "icon.svg" (
    echo 错误：找不到 icon.svg 文件
    pause
    exit /b 1
)

echo 所有必要文件检查完成！
echo.

:: 创建打包目录
set PACKAGE_DIR=dist
if exist "%PACKAGE_DIR%" (
    echo 清理旧的打包目录...
    rmdir /s /q "%PACKAGE_DIR%"
)

echo 创建打包目录...
mkdir "%PACKAGE_DIR%"

:: 复制必要文件
echo 复制插件文件...
copy "manifest.json" "%PACKAGE_DIR%\"
copy "content.js" "%PACKAGE_DIR%\"
copy "background.js" "%PACKAGE_DIR%\"
copy "options.html" "%PACKAGE_DIR%\"
copy "options.js" "%PACKAGE_DIR%\"
copy "icon.svg" "%PACKAGE_DIR%\"

:: 复制本地化文件
if exist "_locales" (
    echo 复制本地化文件...
    xcopy "_locales" "%PACKAGE_DIR%\_locales\" /e /i /q
)

:: 复制文档文件
echo 复制文档文件...
copy "README.md" "%PACKAGE_DIR%\"
copy "LICENSE" "%PACKAGE_DIR%\"
copy "Demo.png" "%PACKAGE_DIR%\"

:: 创建ZIP文件
echo 创建ZIP压缩包...
powershell -command "Compress-Archive -Path '%PACKAGE_DIR%\*' -DestinationPath 'bilibili-video-transcript-v1.1.0.zip' -Force"

echo.
echo ========================================
echo 打包完成！
echo ========================================
echo.
echo 打包文件位置：
echo - 插件目录：%PACKAGE_DIR%\
echo - ZIP压缩包：bilibili-video-transcript-v1.1.0.zip
echo.
echo 安装说明：
echo 1. 打开Chrome浏览器
echo 2. 访问 chrome://extensions/
echo 3. 开启"开发者模式"
echo 4. 点击"加载已解压的扩展程序"
echo 5. 选择 %PACKAGE_DIR% 文件夹
echo.
pause 