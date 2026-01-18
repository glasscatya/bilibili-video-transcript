# 插件名称

Bilibili 视频文稿助手(bilibili-video-transcript)

## 简介

本插件可以将 bilibili 视频逐字稿显示在您的网页中，以便于快速浏览内容，或是复习记录与回顾。支持**极速字幕获取**、**无字幕视频语音识别**以及**多维度 AI 内容生成**。

## 功能

### 1. 基础字幕功能
- **极速获取**：直接通过 B 站 API 获取字幕，无需等待视频播放，秒开显示。
- **自动回退**：如果 API 获取失败，自动尝试模拟点击方式获取。
- **时间戳跳转**：点击任意一行字幕，视频将跳转到对应的时间点。
- **一键复制**：支持复制所有字幕内容。

### 2. 无字幕视频支持 (Whisper API)
针对没有官方/AI 字幕的视频，插件提供两种解决方案：
- **🚀 极速识别 (推荐)**：无需播放视频，直接下载音频流并调用 Whisper API 进行识别。速度快，无需等待。
- **🎙️ 录音识别**：手动录制视频片段进行识别。
- **长视频支持**：通过优化音频参数，支持**40分钟**以内的视频直接识别。

### 3. AI 内容生成
调用大模型将字幕转换为结构化的内容，支持三种模式：
- **📝 逐字稿**：生成通顺、流畅的全文文稿，修正口语语病。
- **📋 视频纪要**：提取核心主题、关键要点和时间线总结。
- **💡 观点提取**：专注于讲者的核心观点、论据和独特见解。

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
powershell -ExecutionPolicy Bypass -File package.ps1
```

详细打包说明请参考 [PACKAGE_GUIDE.md](PACKAGE_GUIDE.md)。

## 使用方法

### 配置 API (必选)
在使用 AI 功能前，请先配置 API：
1. 右键点击插件图标，选择"选项"。
2. 输入您的 API 端点和密钥。
   - **OpenAI 官方**：直接填入 Key，端点留空或填 `https://api.openai.com/v1`。
   - **第三方模型 (DeepSeek/豆包等)**：填入服务商的 Base URL 和 Key，并指定模型名称 (如 `deepseek-chat` 或 `whisper-large-v3`)。

### 场景一：有字幕的视频
1. 打开视频页面，字幕会自动加载。
2. 点击字幕工具栏上的 **✨ AI 生成** 按钮。
3. 选择生成类型：**逐字稿**、**视频纪要**或**观点提取**。

### 场景二：无字幕的视频
1. 插件会自动检测到无字幕，并显示操作面板。
2. 点击 **🚀 极速识别 (无需播放)**，等待音频下载和识别完成。
3. 或者点击 **🎙️ 开始 AI 听写**，播放视频进行录制。
4. 识别完成后，同样可以使用 AI 生成功能。

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

- **当前版本**: 1.2.0
- **主要更新**:
  - ✅ **极速字幕**：支持直接从 B 站 API 获取字幕，秒开体验。
  - ✅ **无字幕支持**：集成 Whisper API，支持极速识别和录音识别。
  - ✅ **多模式 AI**：支持生成视频纪要、观点提取和逐字稿。
  - ✅ **长视频支持**：支持 40 分钟以内视频的语音识别。
  - ✅ **第三方模型**：全面支持 DeepSeek、豆包、智谱等国产大模型配置。

## 联系信息

如果你有任何问题或建议，请通过 [邮箱](mailto:yufangxia1105@gmail.com) 联系我。
