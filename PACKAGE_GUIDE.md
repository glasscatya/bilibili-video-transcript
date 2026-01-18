# Bilibili视频字幕插件打包指南

## 概述

本指南将帮助您将Bilibili视频字幕插件打包成Chrome浏览器扩展程序。

## 文件结构

打包前，请确保您的项目包含以下文件：

```
bilibili-video-transcript/
├── manifest.json          # 插件配置文件
├── content.js             # 内容脚本
├── background.js          # 后台脚本
├── options.html           # 设置页面
├── options.js             # 设置页面脚本
├── icon.svg               # 插件图标
├── _locales/              # 本地化文件
│   └── zh_CN/
│       └── messages.json
├── README.md              # 说明文档
├── LICENSE                # 许可证
├── Demo.png               # 演示图片
├── package.ps1            # 打包脚本 (PowerShell)
└── PACKAGE_GUIDE.md       # 本指南
```

## 自动打包方法

### Windows 用户 (推荐)

1. 打开 PowerShell
2. 运行以下命令：
   ```powershell
   powershell -ExecutionPolicy Bypass -File package.ps1
   ```
3. 打包完成后会在项目根目录生成：
   - `dist/` 文件夹（插件目录）
   - `bilibili-video-transcript-v1.2.0.zip`（压缩包）

注意：脚本会自动检查必要文件，如果缺失会提示错误。

## 手动打包方法

如果自动打包脚本无法使用，您可以手动进行打包：

### 1. 创建打包目录

```bash
mkdir dist
```

### 2. 复制必要文件

```bash
# 复制核心文件
cp manifest.json dist/
cp content.js dist/
cp background.js dist/
cp options.html dist/
cp options.js dist/
cp icon.svg dist/

# 复制本地化文件
cp -r _locales dist/

# 复制文档文件
cp README.md dist/
cp LICENSE dist/
cp Demo.png dist/
```

### 3. 创建ZIP压缩包

将 `dist` 目录下的所有文件压缩为 ZIP 格式。

## 安装插件

### 开发模式安装

1. 打开Chrome浏览器
2. 在地址栏输入：`chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `dist` 文件夹
6. 插件安装完成

### 从ZIP文件安装

1. 解压生成的 ZIP 文件
2. 按照上述"开发模式安装"步骤操作
3. 选择解压后的文件夹

## 发布到Chrome Web Store

如果您想将插件发布到Chrome Web Store，需要：

### 1. 准备发布包

使用生成的ZIP文件或手动创建包含所有必要文件的ZIP压缩包。

### 2. 注册开发者账号

1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. 支付一次性开发者注册费（$5.00）
3. 完成开发者账号注册

### 3. 上传插件

1. 登录开发者控制台
2. 点击"添加新项目"
3. 上传ZIP文件
4. 填写插件信息：
   - 插件名称
   - 描述
   - 截图
   - 隐私政策（如果需要）
5. 提交审核

### 4. 等待审核

Chrome Web Store审核通常需要几天到几周时间。

## 常见问题

### Q: 打包时提示文件缺失
A: 请检查项目根目录是否包含所有必要文件，特别是 `manifest.json`、`content.js`、`background.js` 等核心文件。

### Q: 插件安装后无法正常工作
A: 
1. 检查Chrome控制台是否有错误信息
2. 确认插件权限是否正确
3. 验证API配置是否正确（如果使用AI转换功能）

### Q: 插件图标不显示
A: 
1. 确认 `icon.svg` 文件存在且格式正确
2. 检查 `manifest.json` 中的图标路径配置

## 版本管理

建议在发布新版本时：

1. 更新 `manifest.json` 中的版本号
2. 更新打包脚本中的版本号 (`package.ps1`)
3. 记录版本变更日志
4. 测试所有功能是否正常
