/**
 * Content Script 主入口（纯API模式）
 * 负责UI初始化和URL变化监听
 */

window.BilibiliSubtitle.logInfo("B站字幕助手已启动（纯API模式）")

let initUITimer = null
let initAttemptToken = 0
let uiMutationObserver = null
const INIT_RETRY_DELAY_MS = 500
const INIT_MAX_ATTEMPTS = 30
const HYDRATION_WAIT_LIMIT_MS = 60000

// 视频页为服务端渲染：#app 带 data-server-rendered，Vue 在 hydration 时移除该属性。
// hydration 完成前向 SSR 树（#danmukuBox）插入节点会导致 hydration 失败、页头消失，
// 因此以该属性作为信号，等待其消失后再插入UI，而不是依赖固定延迟。
function isPageHydrating() {
  return !!document.querySelector('[data-server-rendered]')
}

function scheduleInitUI(reason) {
  if (initUITimer) {
    clearTimeout(initUITimer)
    initUITimer = null
  }

  const attemptToken = ++initAttemptToken

  window.BilibiliSubtitle.logDebug(`[初始化] ${reason}`)
  let attempts = 0
  const scheduledAt = Date.now()

  const attemptInit = () => {
    if (attemptToken !== initAttemptToken) return

    if (isPageHydrating()) {
      if (Date.now() - scheduledAt >= HYDRATION_WAIT_LIMIT_MS) {
        initUITimer = null
        window.BilibiliSubtitle.logWarn('[初始化] 等待页面 hydration 完成超时，放弃插入')
        return
      }
      initUITimer = setTimeout(attemptInit, INIT_RETRY_DELAY_MS)
      return
    }

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

function observeUIContainer() {
  if (uiMutationObserver || !document.body) return

  uiMutationObserver = new MutationObserver(() => {
    if (!document.getElementById('bilibili-subtitle-wrapper') && !initUITimer) {
      scheduleInitUI('页面重建了字幕容器')
    }
  })

  uiMutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  })
}

function startInitialUIInitialization() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observeUIContainer()
      scheduleInitUI('DOMContentLoaded')
    }, { once: true })
    return
  }

  observeUIContainer()
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
