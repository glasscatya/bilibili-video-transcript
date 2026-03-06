/**
 * 工具函数模块
 * 提供URL解析、时间格式化、API请求等通用功能
 */

// 使用命名空间
window.BilibiliSubtitle = window.BilibiliSubtitle || {}

/**
 * 获取本地化文案
 */
window.BilibiliSubtitle.getMessage = function(key, fallback) {
  try {
    if (window.chrome && chrome.i18n && typeof chrome.i18n.getMessage === 'function') {
      const message = chrome.i18n.getMessage(key)
      return message || fallback || ''
    }
  } catch (error) {
    return fallback || ''
  }

  return fallback || ''
}

/**
 * 从当前页面URL中提取BVID
 */
window.BilibiliSubtitle.getBVID = function() {
  // 处理watchlater列表页面
  if (window.location.pathname === '/list/watchlater') {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('bvid')
  }
  // 处理常规视频页面
  return window.location.pathname.split('/video/')[1]?.replace('/', '')
}

/**
 * 从当前页面URL中提取分P编号
 */
window.BilibiliSubtitle.getPageNumber = function() {
  const urlParams = new URLSearchParams(window.location.search)
  const page = parseInt(urlParams.get('p') || '1', 10)
  return Number.isNaN(page) ? 1 : page
}

/**
 * 将秒数格式化为 MM:SS 格式
 */
window.BilibiliSubtitle.formatTime = function(seconds) {
  const roundedSeconds = Math.round(seconds)
  const minutes = Math.floor(roundedSeconds / 60)
  const secs = roundedSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * 跳转到指定时间
 */
window.BilibiliSubtitle.jumpToTime = function(seconds) {
  const video = document.querySelector('video')
  if (video) {
    video.currentTime = seconds
  }
}

/**
 * 通过API获取视频信息
 */
window.BilibiliSubtitle.fetchVideoInfoByAPI = async function(bvid) {
  try {
    const page = window.BilibiliSubtitle.getPageNumber()
    const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}&p=${page}`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error('获取视频信息失败')
    const data = await response.json()
    const videoData = data.data

    // 分P时用pages里的cid，避免总是拿到P1
    if (videoData?.pages && videoData.pages.length > 0) {
      const pageIndex = Math.max(page - 1, 0)
      const pageInfo = videoData.pages[pageIndex]
      if (pageInfo) {
        videoData.cid = pageInfo.cid
        videoData.title = pageInfo.part || videoData.title
      }
    }

    return videoData
  } catch (error) {
    window.BilibiliSubtitle.logError('[API方法] 获取视频信息失败:', error)
    throw error
  }
}

/**
 * 通过API获取字幕列表
 */
window.BilibiliSubtitle.fetchSubtitleListByAPI = async function(aid, cid) {
  try {
    const response = await fetch(`https://api.bilibili.com/x/player/wbi/v2?aid=${aid}&cid=${cid}`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error('获取字幕列表失败')
    const data = await response.json()
    return data.data.subtitle.subtitles
  } catch (error) {
    window.BilibiliSubtitle.logError('[API方法] 获取字幕列表失败:', error)
    throw error
  }
}

/**
 * 通过API获取字幕内容
 * 注意：不使用credentials: 'include'以避免CORS问题
 */
window.BilibiliSubtitle.fetchSubtitleContentByAPI = async function(subtitleUrl) {
  try {
    // 确保URL是https
    let url = subtitleUrl
    if (url.startsWith('//')) {
      url = 'https:' + url
    }

    const response = await fetch(url, {
      credentials: 'omit'
    })
    if (!response.ok) throw new Error('获取字幕内容失败')
    const data = await response.json()
    return data.body
  } catch (error) {
    window.BilibiliSubtitle.logError('[API方法] 获取字幕内容失败:', error)
    throw error
  }
}
