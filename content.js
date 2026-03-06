/**
 * Content Script 主入口（纯API模式）
 * 负责UI初始化和URL变化监听
 */

window.BilibiliSubtitle.logInfo("B站字幕助手已启动（纯API模式）")

let initUITimer = null

function scheduleInitUI(reason) {
  if (initUITimer) {
    clearTimeout(initUITimer)
  }
  window.BilibiliSubtitle.logDebug(`[延迟] ${reason}，等待2秒后初始化UI...`)
  initUITimer = setTimeout(() => {
    window.BilibiliSubtitle.logDebug('[延迟] 开始初始化UI')
    window.BilibiliSubtitle.initUI()
  }, 2000)
}

// 监听页面加载完成事件
window.addEventListener('load', function() {
  window.BilibiliSubtitle.logInfo('初始化B站字幕助手（纯API模式）')
  // 关键：延迟2秒再初始化UI，避免与B站Vue应用冲突
  scheduleInitUI('页面加载完成')
})

// 监听页面 URL 变化（使用简单的轮询，不劫持history）
let lastVideoKey = ''

function getVideoKey() {
  const bvid = window.BilibiliSubtitle.getBVID()
  const page = window.BilibiliSubtitle.getPageNumber()
  if (!bvid) return ''
  return `${bvid}-p${page}`
}

lastVideoKey = getVideoKey()

setInterval(() => {
  const currentKey = getVideoKey()
  if (currentKey && currentKey !== lastVideoKey) {
    lastVideoKey = currentKey
    window.BilibiliSubtitle.logDebug('视频标识发生变化，重置字幕状态')
    window.BilibiliSubtitle.resetSubtitleState()
    scheduleInitUI('视频标识发生变化')
  }
}, 1000)
