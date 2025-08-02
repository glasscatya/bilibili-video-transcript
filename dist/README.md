# 插件名称

Bilibili 视频文稿助手(bilibili-video-transcript)

## 简介

本插件可以将 bilibili 视频逐字稿显示在您的网页中，以便于快速浏览内容，或是复习记录与回顾。

## 功能

- 自动加载字幕到视频侧边。（将会优先加载人工字幕，如果没有人工字幕，将加载 ai 字幕。）
- 字幕将自带时间戳，可以跳转至对应时间。
- 一键复制所有字幕。
- **新增：AI 转换字幕为文章** - 调用大模型将字幕转换为流畅的文章，支持多种 AI 服务和字数控制。
  ![功能展示](https://raw.githubusercontent.com/glasscatya/bilibili-video-transcript/main/Demo.png)

## 安装

### Edge 浏览器

Edge 浏览器，可至插件商店下载。

1. 打开浏览器的插件商店。
2. 搜索[“Bilibili 视频文稿助手”](https://microsoftedge.microsoft.com/addons/detail/bilibili%E8%A7%86%E9%A2%91%E6%96%87%E7%A8%BF%E5%8A%A9%E6%89%8B/nbgmggaolhiphnfblaognehbfhfpndol)。
3. 点击“添加到浏览器”按钮。
4. 按照提示完成安装。

### Chrome 浏览器

暂未上架 Chrome 插件商店，可按照以下流程安装：

1. 点击[此链接](https://github.com/glasscatya/bilibili-video-transcript/releases/)。
2. 下载 bilibili-video-transcript.zip，并解压。
3. 开启 Chrome 浏览器插件的开发者模式。
4. 将 bilibili-video-transcript 拖入 chrome://extensions 页面，然后松开鼠标即可完成安装。

### 打包安装

如果您想从源码安装，可以使用提供的打包脚本：

**Windows 用户**：

```powershell
# 推荐使用简化版脚本（避免编码问题）
powershell -ExecutionPolicy Bypass -File package-simple.ps1
```

**Linux/macOS 用户**：

```bash
chmod +x package.sh
./package.sh
```

详细打包说明请参考 [PACKAGE_GUIDE.md](PACKAGE_GUIDE.md)。

## 使用方法

### 基本功能

1. 打开任意一个 Bilibili 视频页面。
2. 若该视频有字幕，插件将会自动工作。
3. 字幕将显示在视频的侧边栏，点击任意一行字幕，视频将跳转到对应的时间点。

### AI 转换文章功能

1. **配置 API 设置**：
   - 右键点击插件图标，选择"选项"
   - 在设置页面输入您的 API 端点和密钥
   - 选择要使用的 AI 模型（支持 GPT-3.5/4、Claude-3、通义千问等）
   - **可选**：设置目标字数（100-10000 字），留空则保持原字幕长度
   - 支持的 API 服务：OpenAI GPT、Anthropic Claude、阿里云通义千问、Azure OpenAI 等
2. **使用转换功能**：
   - 在字幕显示区域点击"📝 转文章"按钮
   - 等待 AI 处理完成
   - 在弹出的模态框中查看转换后的文章
   - 可以一键复制文章内容
   - 转换后的文章会自动保存，再次点击按钮可直接查看

**功能特点**：

- 智能优化文字结构、语法错误、错别字
- 保持原文核心内容和关键信息
- 支持字数控制，可指定目标文章长度
- 文章持久化保存，避免重复转换
- 支持多种主流 AI 模型

**注意**：使用 AI 转换功能需要配置有效的 API 密钥，并确保有足够的 API 调用额度。

## 贡献

欢迎贡献！

1. Fork 本仓库。
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)。
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)。
4. 推送到分支 (`git push origin feature/AmazingFeature`)。
5. 打开一个 Pull Request。

## 许可

本项目采用 GNU General Public License (GPL) v3.0 许可证，详情请参阅 LICENSE 文件

## 版本信息

- **当前版本**: 1.1.0
- **更新日期**: 2024 年
- **主要更新**:
  - ✅ 新增 AI 转换字幕为文章功能
  - ✅ 支持多种 AI 模型（GPT、Claude、通义千问等）
  - ✅ 添加字数控制功能（100-10000 字）
  - ✅ 文章持久化保存，避免重复转换
  - ✅ 提供打包脚本，支持从源码安装

## 联系信息

如果你有任何问题或建议，请通过 [邮箱](mailto:yufangxia1105@gmail.com) 联系我。
