/**
 * UI组件模块（纯API模式）
 * 负责字幕容器的创建、主题管理、字幕显示与交互功能
 */

// 使用命名空间
window.BilibiliSubtitle = window.BilibiliSubtitle || {}

// 状态变量
window.BilibiliSubtitle.isLoading = false
window.BilibiliSubtitle.subtitleListCache = null
window.BilibiliSubtitle.currentSubtitles = []

// 字幕容器尺寸配置
window.BilibiliSubtitle.SUBTITLE_CONTAINER_SIZES = {
  normal: {
    maxHeight: '300px',
    padding: '14px'
  },
  empty: {
    maxHeight: '160px',
    padding: '10px'
  }
}

// 空状态类型
window.BilibiliSubtitle.EMPTY_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  NO_SUBTITLE: 'noSubtitle',
  ERROR: 'error'
}

// 空状态文案配置
window.BilibiliSubtitle.EMPTY_STATE_MESSAGES = {
  idle: {
    titleKey: 'empty_state_idle_title',
    descKey: 'empty_state_idle_desc',
    fallbackTitle: '暂无字幕内容',
    fallbackDesc: '点击“加载字幕”开始加载'
  },
  loading: {
    titleKey: 'empty_state_loading_title',
    descKey: 'empty_state_loading_desc',
    fallbackTitle: '字幕加载中...',
    fallbackDesc: '正在请求字幕列表'
  },
  noSubtitle: {
    titleKey: 'empty_state_no_subtitle_title',
    descKey: 'empty_state_no_subtitle_desc',
    fallbackTitle: '本视频暂无可用字幕',
    fallbackDesc: '可能未上传或已关闭字幕'
  },
  error: {
    titleKey: 'empty_state_error_title',
    descKey: 'empty_state_error_desc',
    fallbackTitle: '字幕获取失败',
    fallbackDesc: '请稍后重试或刷新页面'
  }
}

// ==================== 主题系统 ====================

/**
 * 主题配色方案
 */
window.BilibiliSubtitle.THEME_COLORS = {
  light: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f7f9fb',
    '--bg-tertiary': '#ffffff',
    '--text-primary': '#2f343a',
    '--text-secondary': '#666666',
    '--text-tertiary': '#999999',
    '--border-primary': '#e1e1e1',
    '--border-secondary': '#d9dee5',
    '--border-hover': '#b5bdc6',
    '--accent-primary': '#00b8f6',
    '--accent-hover': '#4fc3f7',
    '--highlight-bg': '#ffffcc',
    '--link-github': '#0366d6',
    '--link-bilibili': '#00a1d6'
  },
  dark: {
    '--bg-primary': '#1e1e1e',
    '--bg-secondary': '#2d2d2d',
    '--bg-tertiary': '#252525',
    '--text-primary': '#e0e0e0',
    '--text-secondary': '#b0b0b0',
    '--text-tertiary': '#808080',
    '--border-primary': '#444444',
    '--border-secondary': '#555555',
    '--border-hover': '#666666',
    '--accent-primary': '#4fc3f7',
    '--accent-hover': '#80d8ff',
    '--highlight-bg': '#3d3d2d',
    '--link-github': '#58a6ff',
    '--link-bilibili': '#4fc3f7'
  }
}

/**
 * 检测当前是否为黑夜模式
 * 支持：B站官方深色模式、Dark Reader等第三方插件
 */
window.BilibiliSubtitle.isDarkMode = function() {
  // 检测 B站官方深色模式
  const html = document.documentElement
  const body = document.body
  
  // B站官方深色模式标识
  if (html.classList.contains('dark') || 
      html.classList.contains('night-mode') ||  // B站官方深色模式
      html.getAttribute('data-theme') === 'dark' ||
      body.getAttribute('data-theme') === 'dark') {
    return true
  }
  
  // 检测 Dark Reader
  if (document.querySelector('.darkreader') || 
      document.querySelector('[data-darkreader-inline-color]')) {
    return true
  }
  
  // 检测其他常见深色模式标识
  if (html.classList.contains('theme-dark') ||
      html.classList.contains('night') ||
      html.classList.contains('dark-mode')) {
    return true
  }
  
  return false
}

/**
 * 应用主题到UI
 */
window.BilibiliSubtitle.applyTheme = function() {
  const wrapper = document.getElementById('bilibili-subtitle-wrapper')
  if (!wrapper) return
  
  const isDark = window.BilibiliSubtitle.isDarkMode()
  const colors = isDark 
    ? window.BilibiliSubtitle.THEME_COLORS.dark 
    : window.BilibiliSubtitle.THEME_COLORS.light
  
  // 应用CSS变量
  Object.entries(colors).forEach(([key, value]) => {
    wrapper.style.setProperty(key, value)
  })
  
  // 应用背景色到具体元素
  const buttonBar = wrapper.querySelector('.buttonBar')
  const subtitleContainer = wrapper.querySelector('.subtitleContainer')
  const footerBar = wrapper.querySelector('.footerBar')
  
  if (buttonBar) {
    buttonBar.style.background = colors['--bg-secondary']
    buttonBar.style.borderBottomColor = colors['--border-primary']
  }
  if (subtitleContainer) {
    subtitleContainer.style.backgroundColor = colors['--bg-primary']
  }
  if (footerBar) {
    footerBar.style.backgroundColor = colors['--bg-primary']
    footerBar.style.borderTopColor = colors['--border-primary']
  }
  
  // 更新按钮样式
  const buttons = wrapper.querySelectorAll('button')
  buttons.forEach(btn => {
    btn.style.backgroundColor = colors['--bg-tertiary']
    btn.style.color = colors['--text-primary']
    btn.style.borderColor = colors['--border-secondary']
  })
  
  // 更新下拉框样式
  const selects = wrapper.querySelectorAll('select')
  selects.forEach(select => {
    select.style.backgroundColor = colors['--bg-tertiary']
    select.style.color = colors['--text-primary']
    select.style.borderColor = colors['--border-secondary']
  })
  
  // 更新链接颜色
  const githubLink = wrapper.querySelector('a[href*="github"]')
  const bilibiliLink = wrapper.querySelector('a[href*="bilibili"]')
  if (githubLink) githubLink.style.color = colors['--link-github']
  if (bilibiliLink) bilibiliLink.style.color = colors['--link-bilibili']
  
  window.BilibiliSubtitle.logDebug(`[Theme] 已应用${isDark ? '暗色' : '亮色'}主题`)
}

/**
 * 初始化主题监听器
 */
window.BilibiliSubtitle.initThemeObserver = function() {
  // 监听 html 和 body 的 class 变化
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme')) {
        window.BilibiliSubtitle.applyTheme()
        break
      }
    }
  })
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme']
  })
  
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class', 'data-theme']
  })
  
  window.BilibiliSubtitle.logDebug('[Theme] 主题监听器已启动')
}

/**
 * 重置字幕状态
 */
window.BilibiliSubtitle.resetSubtitleState = function() {
  window.BilibiliSubtitle.logDebug('[UI] 重置字幕状态')
  window.BilibiliSubtitle.isLoading = false
  window.BilibiliSubtitle.subtitleListCache = null
  window.BilibiliSubtitle.currentSubtitles = []
  window.BilibiliSubtitle.updateSubtitleSelector(
    null,
    null,
    window.BilibiliSubtitle.SUBTITLE_SELECTOR_STATES?.IDLE || 'idle'
  )
  window.BilibiliSubtitle.displaySubtitles([])
}

/**
 * 清空字幕容器内容（保留容器本身）
 */
window.BilibiliSubtitle.clearSubtitleContent = function() {
  window.BilibiliSubtitle.logDebug('[UI] 清空字幕容器内容')
  const wrapper = document.getElementById('bilibili-subtitle-wrapper')
  if (!wrapper) return

  const subtitleContainer = wrapper.querySelector('.subtitleContainer')
  if (subtitleContainer) {
    window.BilibiliSubtitle.renderEmptyState(subtitleContainer, window.BilibiliSubtitle.EMPTY_STATES.IDLE)
  }
  window.BilibiliSubtitle.currentSubtitles = []
}

/**
 * 渲染空状态内容
 */
window.BilibiliSubtitle.renderEmptyState = function(container, stateKey) {
  if (!container) return

  const state = stateKey || window.BilibiliSubtitle.EMPTY_STATES.IDLE
  const messages = window.BilibiliSubtitle.EMPTY_STATE_MESSAGES[state]
    || window.BilibiliSubtitle.EMPTY_STATE_MESSAGES.idle

  const titleText = window.BilibiliSubtitle.getMessage(messages.titleKey, messages.fallbackTitle)
  const descText = window.BilibiliSubtitle.getMessage(messages.descKey, messages.fallbackDesc)

  container.innerHTML = ''
  window.BilibiliSubtitle.applyEmptyContainerStyle(container)

  const title = document.createElement('div')
  title.style.textAlign = 'center'
  title.style.color = 'var(--text-primary, #2f343a)'
  title.style.fontSize = '14px'
  title.style.fontWeight = '500'
  title.style.paddingTop = '14px'
  title.textContent = titleText

  const desc = document.createElement('div')
  desc.style.textAlign = 'center'
  desc.style.color = 'var(--text-tertiary, #999)'
  desc.style.fontSize = '12px'
  desc.style.padding = '6px 12px 14px'
  desc.textContent = descText

  container.appendChild(title)
  if (descText) {
    container.appendChild(desc)
  }
}

/**
 * 切换空状态展示
 */
window.BilibiliSubtitle.setEmptyState = function(stateKey) {
  const wrapper = document.getElementById('bilibili-subtitle-wrapper')
  if (!wrapper) return

  const subtitleContainer = wrapper.querySelector('.subtitleContainer')
  if (!subtitleContainer) return

  window.BilibiliSubtitle.renderEmptyState(subtitleContainer, stateKey)
}

/**
 * 应用空状态容器尺寸
 */
window.BilibiliSubtitle.applyEmptyContainerStyle = function(container) {
  const sizes = window.BilibiliSubtitle.SUBTITLE_CONTAINER_SIZES.empty
  container.dataset.empty = '1'
  container.style.maxHeight = sizes.maxHeight
  container.style.padding = sizes.padding
}

/**
 * 应用内容容器尺寸
 */
window.BilibiliSubtitle.applyContentContainerStyle = function(container) {
  const sizes = window.BilibiliSubtitle.SUBTITLE_CONTAINER_SIZES.normal
  container.dataset.empty = '0'
  container.style.maxHeight = sizes.maxHeight
  container.style.padding = sizes.padding
}

/**
 * 初始化UI容器（只创建一次）
 */
window.BilibiliSubtitle.initUI = function() {
  window.BilibiliSubtitle.logDebug('[UI] initUI() 开始')

  const danmukuBox = document.getElementById('danmukuBox')
  if (!danmukuBox) {
    window.BilibiliSubtitle.logDebug('[UI] initUI() danmukuBox不存在')
    return
  }

  const existingWrapper = document.getElementById('bilibili-subtitle-wrapper')
  if (existingWrapper) {
    window.BilibiliSubtitle.logDebug('[UI] initUI() UI已存在，跳过创建')
    return
  }

  window.BilibiliSubtitle.logDebug('[UI] initUI() 创建UI容器')
  window.BilibiliSubtitle.createUI()
}

/**
 * 创建UI容器
 */
window.BilibiliSubtitle.createUI = function() {
  const danmukuBox = document.getElementById('danmukuBox')
  if (!danmukuBox) return

  window.BilibiliSubtitle.logDebug('[UI] 创建容器')

  const wrapper = document.createElement('div')
  wrapper.id = 'bilibili-subtitle-wrapper'
  wrapper.style.position = 'relative'
  wrapper.style.marginBottom = '10px'
  wrapper.style.display = 'block'
  wrapper.style.border = '1px solid var(--border-primary, #e1e1e1)'
  wrapper.style.borderRadius = '8px'
  wrapper.style.backgroundColor = 'var(--bg-primary, #ffffff)'
  wrapper.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
  wrapper.style.overflow = 'hidden'
  wrapper.style.fontFamily = 'HarmonyOS Sans SC, Source Han Sans SC, PingFang SC, Microsoft YaHei, sans-serif'

  const applyButtonStyle = (button) => {
    button.style.height = '26px'
    button.style.padding = '0 6px'
    button.style.fontSize = '12px'
    button.style.fontWeight = '500'
    button.style.color = 'var(--text-primary, #2f343a)'
    button.style.cursor = 'pointer'
    button.style.border = '1px solid var(--border-secondary, #d9dee5)'
    button.style.borderRadius = '6px'
    button.style.backgroundColor = 'var(--bg-tertiary, #ffffff)'
    button.style.transition = 'all 0.2s ease'
    button.style.whiteSpace = 'nowrap'
    button.style.flexShrink = '0'
  }

  const addHoverEffect = (element) => {
    element.addEventListener('mouseenter', () => {
      element.style.backgroundColor = 'var(--bg-secondary, #f7f9fb)'
      element.style.borderColor = 'var(--border-hover, #b5bdc6)'
    })
    element.addEventListener('mouseleave', () => {
      element.style.backgroundColor = 'var(--bg-tertiary, #ffffff)'
      element.style.borderColor = 'var(--border-secondary, #d9dee5)'
    })
  }

  const applySelectStyle = (select) => {
    select.style.height = '26px'
    select.style.padding = '0 4px'
    select.style.fontSize = '12px'
    select.style.border = '1px solid var(--border-secondary, #d9dee5)'
    select.style.borderRadius = '6px'
    select.style.backgroundColor = 'var(--bg-tertiary, #ffffff)'
    select.style.color = 'var(--text-primary, #2f343a)'
    select.style.cursor = 'pointer'
    select.style.transition = 'border-color 0.2s ease'
    select.style.flexShrink = '1'
  }

  const addSelectHoverEffect = (select) => {
    select.addEventListener('mouseenter', () => {
      select.style.borderColor = 'var(--border-hover, #b5bdc6)'
    })
    select.addEventListener('mouseleave', () => {
      select.style.borderColor = 'var(--border-secondary, #d9dee5)'
    })
  }

  // === 字幕容器 ===
  const subtitleContainer = document.createElement('div')
  subtitleContainer.className = 'subtitleContainer'
  subtitleContainer.style.backgroundColor = 'var(--bg-primary, #ffffff)'
  subtitleContainer.style.padding = window.BilibiliSubtitle.SUBTITLE_CONTAINER_SIZES.empty.padding
  subtitleContainer.style.maxHeight = window.BilibiliSubtitle.SUBTITLE_CONTAINER_SIZES.empty.maxHeight
  subtitleContainer.style.overflowY = 'auto'
  subtitleContainer.style.fontSize = '14px'
  subtitleContainer.style.transition = 'max-height 0.3s ease-out'
  subtitleContainer.dataset.empty = '1'

  window.BilibiliSubtitle.renderEmptyState(subtitleContainer, window.BilibiliSubtitle.EMPTY_STATES.IDLE)

  // === 按钮栏 ===
  const buttonBar = document.createElement('div')
  buttonBar.className = 'buttonBar'
  buttonBar.style.marginBottom = '0'
  buttonBar.style.position = 'sticky'
  buttonBar.style.top = '0'
  buttonBar.style.background = 'var(--bg-secondary, #f7f9fb)'
  buttonBar.style.zIndex = '1'
  buttonBar.style.display = 'flex'
  buttonBar.style.alignItems = 'center'
  buttonBar.style.flexWrap = 'nowrap'
  buttonBar.style.gap = '6px'
  buttonBar.style.padding = '8px 10px'
  buttonBar.style.borderBottom = '1px solid var(--border-primary, #e6e8ec)'

  const leftGroup = document.createElement('div')
  leftGroup.style.display = 'flex'
  leftGroup.style.alignItems = 'center'
  leftGroup.style.flex = '1'
  leftGroup.style.flexWrap = 'nowrap'
  leftGroup.style.gap = '4px'

  const rightGroup = document.createElement('div')
  rightGroup.style.marginLeft = 'auto'
  rightGroup.style.display = 'flex'
  rightGroup.style.alignItems = 'center'
  rightGroup.style.flexShrink = '0'
  rightGroup.style.gap = '4px'

  // 创建显示/隐藏时间戳按钮
  const toggleTimestampButton = document.createElement('button')
  toggleTimestampButton.textContent = '时间戳'
  applyButtonStyle(toggleTimestampButton)

  let showTimestamp = true
  addHoverEffect(toggleTimestampButton)
  toggleTimestampButton.onclick = () => {
    window.BilibiliSubtitle.toggleTimestamp(subtitleContainer, toggleTimestampButton, showTimestamp)
    showTimestamp = !showTimestamp
  }

  // 创建复制按钮
  const copyButton = document.createElement('button')
  copyButton.textContent = '复制'
  applyButtonStyle(copyButton)
  addHoverEffect(copyButton)
  copyButton.onclick = () => window.BilibiliSubtitle.copySubtitlesToClipboard(null, copyButton, showTimestamp)

  // 创建定位到当前视频字幕的位置按钮
  const focusButton = document.createElement('button')
  focusButton.textContent = '定位'
  applyButtonStyle(focusButton)
  addHoverEffect(focusButton)
  focusButton.onclick = () => window.BilibiliSubtitle.focusCurrentSubtitle(null, subtitleContainer)

  // 创建字幕选择下拉菜单
  const subtitleSelector = document.createElement('select')
  subtitleSelector.id = 'subtitleSelector'
  subtitleSelector.style.width = '88px'
  subtitleSelector.style.maxWidth = '96px'
  subtitleSelector.style.minWidth = '72px'
  const initialSubtitleOption = document.createElement('option')
  initialSubtitleOption.value = ''
  initialSubtitleOption.textContent = '加载字幕'
  subtitleSelector.appendChild(initialSubtitleOption)
  applySelectStyle(subtitleSelector)
  addSelectHoverEffect(subtitleSelector)

  const tryFetchSubtitleOnDemand = () => {
    if (!window.BilibiliSubtitle.subtitleListCache && !window.BilibiliSubtitle.isLoading) {
      window.BilibiliSubtitle.fetchSubtitleByAPI()
    }
  }

  subtitleSelector.addEventListener('mousedown', tryFetchSubtitleOnDemand)
  subtitleSelector.addEventListener('touchstart', tryFetchSubtitleOnDemand, { passive: true })
  subtitleSelector.addEventListener('focus', tryFetchSubtitleOnDemand)

  subtitleSelector.onchange = () => {
    const subtitleId = subtitleSelector.value
    const subtitleList = window.BilibiliSubtitle.subtitleListCache
    if (subtitleList && subtitleId) {
      const subtitle = subtitleList.find((s) => {
        if (window.BilibiliSubtitle.getSubtitleOptionValue) {
          return window.BilibiliSubtitle.getSubtitleOptionValue(s) === subtitleId
        }
        return s.id.toString() === subtitleId.toString()
      })
      if (subtitle) {
        window.BilibiliSubtitle.selectSubtitle(subtitle)
      }
    } else if (!window.BilibiliSubtitle.isLoading) {
      tryFetchSubtitleOnDemand()
    }
  }

  // 创建折叠按钮
  const toggleFoldButton = document.createElement('button')
  toggleFoldButton.textContent = '折叠'
  applyButtonStyle(toggleFoldButton)
  addHoverEffect(toggleFoldButton)
  toggleFoldButton.onclick = () => window.BilibiliSubtitle.toggleFold(subtitleContainer, toggleFoldButton)

  leftGroup.appendChild(toggleTimestampButton)
  leftGroup.appendChild(copyButton)
  leftGroup.appendChild(focusButton)
  leftGroup.appendChild(subtitleSelector)
  rightGroup.appendChild(toggleFoldButton)
  buttonBar.appendChild(leftGroup)
  buttonBar.appendChild(rightGroup)

  // === 底部页脚 ===
  const footerBar = document.createElement('div')
  footerBar.className = 'footerBar'
  footerBar.style.padding = '10px'
  footerBar.style.backgroundColor = 'var(--bg-primary, #ffffff)'
  footerBar.style.borderTop = '1px solid var(--border-primary, #e1e1e1)'
  footerBar.style.display = 'flex'
  footerBar.style.justifyContent = 'center'
  footerBar.style.alignItems = 'center'

  const showStarMenu = Math.random() < 0.3
  if (showStarMenu) {
    const starMenu = document.createElement('div')
    starMenu.style.display = 'inline-flex'
    starMenu.style.alignItems = 'center'
    starMenu.style.fontSize = '10px'
    starMenu.style.color = 'var(--text-secondary, #666)'
    starMenu.style.textAlign = 'center'
    starMenu.style.gap = '2px'

    const starPrefixText = window.BilibiliSubtitle.getMessage(
      'footer_star_prompt_prefix',
      '如果插件对你有帮助，欢迎给个'
    )
    const starSuffixText = window.BilibiliSubtitle.getMessage(
      'footer_star_prompt_suffix',
      '！'
    )

    const starLink = document.createElement('a')
    starLink.href = 'https://github.com/glasscatya/bilibili-video-transcript'
    starLink.target = '_blank'
    starLink.textContent = window.BilibiliSubtitle.getMessage(
      'footer_star_link_text',
      'star'
    )
    starLink.style.color = 'var(--link-github, #0366d6)'
    starLink.style.textDecoration = 'none'

    starMenu.appendChild(document.createTextNode(starPrefixText))
    starMenu.appendChild(starLink)
    starMenu.appendChild(document.createTextNode(starSuffixText))

    footerBar.appendChild(starMenu)
  } else {
    // 创建作者信息和链接
    const authorInfo = document.createElement('div')
    authorInfo.style.fontSize = '10px'
    authorInfo.style.color = 'var(--text-secondary, #666)'
    const madeWith = document.createTextNode('Made with ❤️ by ')
    const githubLink = document.createElement('a')
    githubLink.href = 'https://github.com/glasscatya/bilibili-video-transcript'
    githubLink.target = '_blank'
    githubLink.textContent = 'glasscat'
    githubLink.style.color = 'var(--link-github, #0366d6)'
    githubLink.style.textDecoration = 'none'
    const comma = document.createTextNode(', contact me: ')
    const bilibiliLink = document.createElement('a')
    bilibiliLink.href = 'https://space.bilibili.com/93398070'
    bilibiliLink.target = '_blank'
    bilibiliLink.textContent = 'bilibili'
    bilibiliLink.style.color = 'var(--link-bilibili, #00a1d6)'
    bilibiliLink.style.textDecoration = 'none'
    authorInfo.appendChild(madeWith)
    authorInfo.appendChild(githubLink)
    authorInfo.appendChild(comma)
    authorInfo.appendChild(bilibiliLink)

    footerBar.appendChild(authorInfo)
  }

  wrapper.appendChild(buttonBar)
  wrapper.appendChild(subtitleContainer)
  wrapper.appendChild(footerBar)

  danmukuBox.insertBefore(wrapper, danmukuBox.firstChild)

  if (window.BilibiliSubtitle.updateSubtitleSelector) {
    window.BilibiliSubtitle.updateSubtitleSelector(
      null,
      null,
      window.BilibiliSubtitle.SUBTITLE_SELECTOR_STATES?.IDLE || 'idle'
    )
  }

  // 初始化主题
  window.BilibiliSubtitle.applyTheme()
  window.BilibiliSubtitle.initThemeObserver()

  window.BilibiliSubtitle.logInfo('[UI] 容器创建完成并已插入')
}

/**
 * 显示字幕内容
 */
window.BilibiliSubtitle.displaySubtitles = function(subtitles, emptyStateKey) {
  window.BilibiliSubtitle.currentSubtitles = subtitles || []

  const wrapper = document.getElementById('bilibili-subtitle-wrapper')
  if (!wrapper) return

  const subtitleContainer = wrapper.querySelector('.subtitleContainer')
  if (!subtitleContainer) return

  // 清空现有内容
  subtitleContainer.innerHTML = ''

  // 添加字幕内容或空提示
  if (!subtitles || subtitles.length === 0) {
    const state = emptyStateKey || window.BilibiliSubtitle.EMPTY_STATES.IDLE
    window.BilibiliSubtitle.renderEmptyState(subtitleContainer, state)
  } else {
    window.BilibiliSubtitle.applyContentContainerStyle(subtitleContainer)

    subtitles.forEach(subtitle => {
      const time = window.BilibiliSubtitle.formatTime(subtitle.from)
      const timeElement = document.createElement('span')
      timeElement.textContent = time
      timeElement.style.color = 'var(--accent-primary, #00b8f6)'
      timeElement.style.marginRight = '14px'
      timeElement.style.cursor = 'pointer'
      timeElement.style.fontSize = '14px'
      timeElement.onclick = () => window.BilibiliSubtitle.jumpToTime(subtitle.from)

      // 使用 div 替代 p，避免浏览器手动复制时在段落间插入额外空行
      const line = document.createElement('div')
      line.style.color = 'var(--text-primary, #2f343a)'
      line.style.marginBottom = '2px'
      line.appendChild(timeElement)
      line.appendChild(document.createTextNode(subtitle.content))
      subtitleContainer.appendChild(line)
    })
  }
}

/**
 * 切换时间戳显示
 */
window.BilibiliSubtitle.toggleTimestamp = function(subtitleContainer, button, showTimestamp) {
  const shouldShow = !showTimestamp
  const timeElements = subtitleContainer.querySelectorAll('span')
  timeElements.forEach(element => {
    element.style.display = shouldShow ? 'inline-block' : 'none'
  })
  button.textContent = shouldShow ? '仅文本' : '时间戳'
}

/**
 * 复制字幕到剪贴板
 */
window.BilibiliSubtitle.copySubtitlesToClipboard = function(subtitles, button, showTimestamp) {
  const effectiveSubtitles = (subtitles && subtitles.length > 0)
    ? subtitles
    : (window.BilibiliSubtitle.currentSubtitles || [])

  const textToCopy = effectiveSubtitles.map(subtitle => {
    if (showTimestamp) {
      return `${window.BilibiliSubtitle.formatTime(subtitle.from)} ${subtitle.content}`
    } else {
      return subtitle.content
    }
  }).join('\n')

  navigator.clipboard.writeText(textToCopy).then(() => {
    button.textContent = '成功'
    setTimeout(() => {
      button.textContent = '复制'
    }, 2000)
  }).catch(err => {
    window.BilibiliSubtitle.logError('复制失败:', err)
    button.textContent = '失败'
    setTimeout(() => {
      button.textContent = '复制'
    }, 2000)
  })
}

/**
 * 定位到当前字幕
 */
window.BilibiliSubtitle.focusCurrentSubtitle = function(subtitles, subtitleContainer) {
  const video = document.querySelector('video')
  if (!video) return

  const currentTime = video.currentTime
  if (!subtitleContainer) return

  const effectiveSubtitles = (subtitles && subtitles.length > 0)
    ? subtitles
    : (window.BilibiliSubtitle.currentSubtitles || [])

  let closestSubtitle = null
  let closestTimeDiff = Infinity

  effectiveSubtitles.forEach(subtitle => {
    const timeDiff = Math.abs(subtitle.from - currentTime)
    if (timeDiff < closestTimeDiff) {
      closestTimeDiff = timeDiff
      closestSubtitle = subtitle
    }
  })

  if (closestSubtitle) {
    const subtitleElements = subtitleContainer.querySelectorAll('div')
    let highlightTimeout = null

    subtitleElements.forEach((element) => {
      const timeElement = element.querySelector('span')
      if (timeElement && timeElement.textContent === window.BilibiliSubtitle.formatTime(closestSubtitle.from)) {
        const offsetTop = element.offsetTop
        subtitleContainer.scrollTo({
          top: offsetTop - (subtitleContainer.clientHeight / 2),
          behavior: 'smooth'
        })

        if (highlightTimeout) {
          clearTimeout(highlightTimeout)
        }
        element.style.backgroundColor = 'var(--highlight-bg, #ffffcc)'
        highlightTimeout = setTimeout(() => {
          element.style.backgroundColor = ''
          highlightTimeout = null
        }, 2000)
      }
    })
  }
}

/**
 * 折叠/展开字幕容器
 */
window.BilibiliSubtitle.toggleFold = function(container, button) {
  const sizes = container.dataset.empty === '1'
    ? window.BilibiliSubtitle.SUBTITLE_CONTAINER_SIZES.empty
    : window.BilibiliSubtitle.SUBTITLE_CONTAINER_SIZES.normal

  if (container.style.maxHeight === '0px' || container.style.maxHeight === '') {
    container.style.maxHeight = sizes.maxHeight
    container.style.padding = sizes.padding
    button.textContent = '折叠'
  } else {
    container.style.maxHeight = '0px'
    container.style.padding = '0'
    button.textContent = '展开'
  }
}
