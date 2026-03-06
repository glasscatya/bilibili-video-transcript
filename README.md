# Bilibili 视频文稿助手

[![Version](https://img.shields.io/badge/version-2.0.1-blue.svg)](https://github.com/glasscatya/bilibili-video-transcript/releases)
[![License](https://img.shields.io/badge/license-GPL%20v3.0-green.svg)](LICENSE)
[![Edge](https://img.shields.io/badge/Edge-商店-0078D7.svg)](https://microsoftedge.microsoft.com/addons/detail/bilibili%E8%A7%86%E9%A2%91%E6%96%87%E7%A8%BF%E5%8A%A9%E6%89%8B/nbgmggaolhiphnfblaognehbfhfpndol)
[![Chrome](https://img.shields.io/badge/Chrome-审核中-yellow.svg)](https://github.com/glasscatya/bilibili-video-transcript/releases/)
[![Users](https://img.shields.io/badge/users-11k+-brightgreen.svg)](https://microsoftedge.microsoft.com/addons/detail/bilibili%E8%A7%86%E9%A2%91%E6%96%87%E7%A8%BF%E5%8A%A9%E6%89%8B/nbgmggaolhiphnfblaognehbfhfpndol)
[![Stars](https://img.shields.io/github/stars/glasscatya/bilibili-video-transcript?style=social)](https://github.com/glasscatya/bilibili-video-transcript)

## 简介
本插件可以将bilibili视频逐字稿显示在您的网页中，以便于快速浏览内容，或是复习记录与回顾。

## 功能

- **字幕提取** — 点击字幕下拉框加载字幕，侧边栏展示完整文稿
- **时间跳转** — 点击任意字幕行的时间戳，视频自动跳转至对应时间点
- **多语言切换** — 自由选择视频提供的所有可用字幕语言
- **一键复制** — 快速复制全部字幕内容到剪贴板
- **深色模式** — 完美适配 Bilibili 原生深色模式及 Dark Reader 等插件

![功能展示](https://raw.githubusercontent.com/glasscatya/bilibili-video-transcript/main/Demo.png)

## 路线图

正在开发或计划中的功能：

- [ ] **自由调节文本大小** — 支持自定义字幕字体大小
- [ ] **加载模式** — 默认加载字幕或手动加载
- [ ] **AI 能力接入** — 智能总结与多语言翻译
- [ ] **性能优化** — 超长字幕列表性能优化
- [ ] **更多自定义行为** — 支持个性化

## 安装

### Edge 浏览器

推荐通过 Edge 商店一键安装：

1. 打开 Edge 浏览器的插件商店
2. 搜索 [**Bilibili 视频文稿助手**](https://microsoftedge.microsoft.com/addons/detail/bilibili%E8%A7%86%E9%A2%91%E6%96%87%E7%A8%BF%E5%8A%A9%E6%89%8B/nbgmggaolhiphnfblaognehbfhfpndol)
3. 点击 **「添加到浏览器」** 按钮
4. 按照提示完成安装

### Chrome 浏览器

Chrome 商店审核中，暂时需要通过以下方式手动安装：

1. 访问 [**GitHub Releases**](https://github.com/glasscatya/bilibili-video-transcript/releases/) 页面
2. 下载 `bilibili-video-transcript.zip` 并解压
3. 打开 Chrome 扩展管理页面（`chrome://extensions/`），开启 **开发者模式**
4. 将解压后的文件夹拖拽至扩展页面完成安装

## 兼容性

| 浏览器 | 最低版本 | 支持状态 |
|:------:|:--------:|:--------:|
| Edge   | 88+      | ✅ 完全支持 |
| Chrome | 88+      | ✅ 完全支持 |

> **注意**：本插件依赖 Manifest V3 扩展 API，请确保浏览器版本符合要求。

## 使用方法

如何使用插件的各项功能：
1. 打开任意一个Bilibili视频页面。
2. 若该视频有字幕，插件将创建一个UI容器，在用户点击“加载字幕”下拉框后，加载字幕。
3. 字幕将显示在视频的侧边栏，点击任意一行字幕，视频将跳转到对应的时间点。

## 贡献

> ⚠️ **目前暂停接收 Pull Request**
>
> 由于项目即将进行较大规模的重构，暂时停止接受新功能 PR。如有建议或发现 Bug，欢迎提交 Issue 讨论！

欢迎提交 Issue 反馈问题或建议！

---

## 许可

本项目采用 [GPL v3.0](LICENSE) 许可证。

---

<p align="center">
  有问题或建议？欢迎发送邮件至 <a href="mailto:glasscat1105@gmail.com">glasscat1105@gmail.com</a>
</p>
