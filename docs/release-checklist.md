# 发布检查清单

## 代码和权限

- [ ] `manifest.json` 版本号已提升且未使用
- [ ] 没有 `webRequest`、`activeTab`、`tabs`、`webNavigation`、`scripting`
- [ ] 没有 `<all_urls>` 或其他不必要的 host permission
- [ ] Manifest 引用文件全部存在
- [ ] 生产包日志级别为 `WARN`
- [ ] ZIP 包含 `LICENSE`

## 干净环境测试

- [ ] 普通有字幕视频
- [ ] 分 P 视频
- [ ] 稍后再看
- [ ] 字幕切换
- [ ] 时间跳转
- [ ] 带时间戳复制
- [ ] 纯文本复制
- [ ] 无字幕状态
- [ ] 刷新和 SPA 视频切换
- [ ] Network 无 CORS、权限或意外域名请求

## 发布材料

- [ ] 隐私政策公开可访问
- [ ] 商店描述与实际行为一致
- [ ] 已声明非官方产品
- [ ] 联系方式可用
- [ ] 截图清晰且不包含个人隐私
- [ ] 保存 ZIP 和 SHA-256
