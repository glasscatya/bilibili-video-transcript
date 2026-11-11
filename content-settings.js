/**
 * 设置模块
 * 管理用户设置的默认值与持久化（chrome.storage.local）
 */

// 使用命名空间
window.BilibiliSubtitle = window.BilibiliSubtitle || {}

// 设置项默认值。新增设置项时在此登记；未来的设置页读写同一份 chrome.storage.local 数据
window.BilibiliSubtitle.DEFAULT_SETTINGS = {
  autoFollow: false // 字幕跟随视频滚动
}

// 当前生效的设置（读取完成前为默认值）
window.BilibiliSubtitle.settings = { ...window.BilibiliSubtitle.DEFAULT_SETTINGS }

/**
 * 从 chrome.storage.local 读取设置，缺失项使用默认值
 */
window.BilibiliSubtitle.loadSettings = async function() {
  try {
    const stored = await chrome.storage.local.get(window.BilibiliSubtitle.DEFAULT_SETTINGS)
    Object.assign(window.BilibiliSubtitle.settings, stored)
  } catch (error) {
    window.BilibiliSubtitle.logWarn('[设置] 读取设置失败，使用默认值:', error)
  }
  return window.BilibiliSubtitle.settings
}

/**
 * 更新单个设置项并持久化（内存中的设置立即生效）
 */
window.BilibiliSubtitle.saveSetting = async function(key, value) {
  window.BilibiliSubtitle.settings[key] = value
  try {
    await chrome.storage.local.set({ [key]: value })
  } catch (error) {
    window.BilibiliSubtitle.logWarn(`[设置] 保存设置 ${key} 失败:`, error)
  }
}

// 脚本加载时即开始读取，UI 创建后等待该 Promise 再按已保存的设置刷新
window.BilibiliSubtitle.settingsReady = window.BilibiliSubtitle.loadSettings()
