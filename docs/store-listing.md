# Chrome Web Store 发布材料

## 产品名称

Bilibili 视频文稿助手

## 简短描述

在 Bilibili 视频页面查看字幕文稿，支持分 P、字幕切换、时间跳转和复制。

## 详细描述

Bilibili 视频文稿助手将 Bilibili 视频提供的字幕显示在视频页面中，方便快速浏览、复习和回顾。

- 点击“加载字幕”查看当前视频的字幕文稿
- 支持普通视频、分 P 视频和稍后再看页面
- 在可用字幕之间切换语言
- 点击时间戳跳转到视频对应位置
- 复制带时间戳或纯文本字幕
- 支持 Bilibili 深色模式
- 视频没有字幕时显示明确的空状态

本扩展是非官方工具，与 Bilibili 没有隶属或授权关系。本扩展没有 AI、登录、订阅或开发者自有服务器功能。

## 数据使用和隐私

本扩展只在匹配的 Bilibili 视频页面运行。加载字幕时，它会向 Bilibili 官方接口请求视频和字幕信息；视频信息和字幕列表请求会使用当前浏览器的 Bilibili 会话凭据。字幕正文请求使用 Bilibili 返回的 HTTPS 字幕地址，不携带登录凭据。本扩展不会读取或保存密码、Cookie，不会读取剪贴板，也不会把数据发送到开发者服务器。用户点击复制后，当前字幕会写入系统剪贴板。

公开隐私政策：<https://glasscatya.github.io/bilibili-video-transcript/privacy.html>

## 权限说明

本版本不声明 Chrome 扩展权限和通配符网站访问权限。内容脚本仅匹配：

- `https://www.bilibili.com/video/*`
- `https://www.bilibili.com/list/watchlater*`

## 非官方产品说明

本扩展由独立开发者维护，仅使用 Bilibili 页面和官方接口提供的内容。Bilibili 是其各自权利人的商标，本扩展不代表 Bilibili。

## 联系方式

- 邮箱：<glasscat1105@gmail.com>
- GitHub：<https://github.com/glasscatya/bilibili-video-transcript>
- Issues：<https://github.com/glasscatya/bilibili-video-transcript/issues>

## 审核步骤

1. 在干净的 Chrome 配置文件中安装发布 ZIP。
2. 打开一个有字幕的普通 Bilibili 视频。
3. 点击“加载字幕”，确认字幕列表和正文出现。
4. 打开分 P 视频的 `?p=2` 页面，确认加载的是对应分 P 字幕。
5. 从稍后再看页面打开视频，确认可以加载字幕。
6. 切换字幕语言，确认正文更新。
7. 点击时间戳，确认视频跳转。
8. 分别复制带时间戳和纯文本字幕，确认剪贴板内容正确。
9. 打开没有字幕的视频，确认显示“无字幕”且页面不报错。
10. 刷新页面并切换视频，确认不会创建重复容器或产生额外页面刷新。
11. 在扩展详情和 DevTools Network 中确认没有额外权限、通配符访问权限或开发者服务器请求。

## 截图材料

- 现有功能截图：`Demo.png`
- 发布前建议额外截取：普通视频字幕、分 P 字幕、字幕切换、无字幕状态、复制结果五张清晰截图。
