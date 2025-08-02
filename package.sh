#!/bin/bash

echo "========================================"
echo "Bilibili视频字幕插件打包工具"
echo "========================================"
echo

# 检查必要文件是否存在
echo "检查必要文件..."
if [ ! -f "manifest.json" ]; then
    echo "错误：找不到 manifest.json 文件"
    exit 1
fi

if [ ! -f "content.js" ]; then
    echo "错误：找不到 content.js 文件"
    exit 1
fi

if [ ! -f "background.js" ]; then
    echo "错误：找不到 background.js 文件"
    exit 1
fi

if [ ! -f "options.html" ]; then
    echo "错误：找不到 options.html 文件"
    exit 1
fi

if [ ! -f "options.js" ]; then
    echo "错误：找不到 options.js 文件"
    exit 1
fi

if [ ! -f "icon.svg" ]; then
    echo "错误：找不到 icon.svg 文件"
    exit 1
fi

echo "所有必要文件检查完成！"
echo

# 创建打包目录
PACKAGE_DIR="dist"
if [ -d "$PACKAGE_DIR" ]; then
    echo "清理旧的打包目录..."
    rm -rf "$PACKAGE_DIR"
fi

echo "创建打包目录..."
mkdir -p "$PACKAGE_DIR"

# 复制必要文件
echo "复制插件文件..."
cp manifest.json "$PACKAGE_DIR/"
cp content.js "$PACKAGE_DIR/"
cp background.js "$PACKAGE_DIR/"
cp options.html "$PACKAGE_DIR/"
cp options.js "$PACKAGE_DIR/"
cp icon.svg "$PACKAGE_DIR/"

# 复制本地化文件
if [ -d "_locales" ]; then
    echo "复制本地化文件..."
    cp -r _locales "$PACKAGE_DIR/"
fi

# 复制文档文件
echo "复制文档文件..."
cp README.md "$PACKAGE_DIR/"
cp LICENSE "$PACKAGE_DIR/"
cp Demo.png "$PACKAGE_DIR/"

# 创建ZIP文件
echo "创建ZIP压缩包..."
cd "$PACKAGE_DIR"
zip -r "../bilibili-video-transcript-v1.1.0.zip" .
cd ..

echo
echo "========================================"
echo "打包完成！"
echo "========================================"
echo
echo "打包文件位置："
echo "- 插件目录：$PACKAGE_DIR/"
echo "- ZIP压缩包：bilibili-video-transcript-v1.1.0.zip"
echo
echo "安装说明："
echo "1. 打开Chrome浏览器"
echo "2. 访问 chrome://extensions/"
echo "3. 开启"开发者模式""
echo "4. 点击"加载已解压的扩展程序""
echo "5. 选择 $PACKAGE_DIR 文件夹"
echo 