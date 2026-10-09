/**
 * Content Script 主入口（纯API模式）
 * 负责UI初始化和URL变化监听
 */

window.BilibiliSubtitle.logInfo("B站字幕助手已启动（纯API模式）")

let initUITimer = null
const INIT_RETRY_DELAY_MS = 500
const INIT_MAX_ATTEMPTS = 30

function scheduleInitUI(reason) {
  if (initUITimer) {
    clearTimeout(initUITimer)
    initUITimer = null
  }

  window.BilibiliSubtitle.logDebug(`[初始化] ${reason}`)
  let attempts = 0

  const attemptInit = () => {
    attempts += 1
    window.BilibiliSubtitle.initUI()

    if (document.getElementById('bilibili-subtitle-wrapper')) {
      initUITimer = null
      window.BilibiliSubtitle.logInfo('B站字幕助手 UI 初始化完成')
      return
    }

    if (attempts >= INIT_MAX_ATTEMPTS) {
      initUITimer = null
      window.BilibiliSubtitle.logWarn('[初始化] 等待 danmukuBox 超时')
      return
    }

    initUITimer = setTimeout(attemptInit, INIT_RETRY_DELAY_MS)
  }

  attemptInit()
}

function startInitialUIInitialization() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scheduleInitUI('DOMContentLoaded')
    }, { once: true })
    return
  }

  scheduleInitUI(`document.readyState=${document.readyState}`)
}

startInitialUIInitialization()

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
