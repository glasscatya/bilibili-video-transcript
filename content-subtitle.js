/**
 * 字幕业务逻辑模块（纯API模式）
 * 负责通过B站API获取字幕数据
 */

// 使用命名空间
window.BilibiliSubtitle = window.BilibiliSubtitle || {}

// 状态变量
window.BilibiliSubtitle.isLoading = false  // 标记是否正在加载
window.BilibiliSubtitle.hasInitializedUI = false  // 标记UI是否已初始化（全局）
window.BilibiliSubtitle.subtitleListCache = null  // 缓存字幕列表
window.BilibiliSubtitle.currentSubtitles = window.BilibiliSubtitle.currentSubtitles || []
window.BilibiliSubtitle.SUBTITLE_SELECTOR_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  NO_SUBTITLE: 'noSubtitle',
  ERROR: 'error'
}
window.BilibiliSubtitle.SUBTITLE_SOURCE = {
  HUMAN: 'human',
  AI: 'ai',
  UNKNOWN: 'unknown'
}

/**
 * 更新字幕下拉状态文案
 */
window.BilibiliSubtitle.setSubtitleSelectorState = function(stateKey) {
  const wrapper = document.getElementById('bilibili-subtitle-wrapper')
  if (!wrapper) return

  const select = wrapper.querySelector('#subtitleSelector')
  if (!select) return

  const state = stateKey || window.BilibiliSubtitle.SUBTITLE_SELECTOR_STATES.IDLE
  const option = document.createElement('option')
  option.value = ''

  if (state === window.BilibiliSubtitle.SUBTITLE_SELECTOR_STATES.LOADING) {
    option.textContent = '加载中...'
    select.disabled = true
  } else if (state === window.BilibiliSubtitle.SUBTITLE_SELECTOR_STATES.NO_SUBTITLE) {
    option.textContent = '无字幕'
    select.disabled = true
  } else if (state === window.BilibiliSubtitle.SUBTITLE_SELECTOR_STATES.ERROR) {
    option.textContent = '加载失败，点击重试'
    select.disabled = false
  } else {
    option.textContent = '加载字幕'
    select.disabled = false
  }

  select.innerHTML = ''
  select.appendChild(option)
  select.value = ''
}

/**
 * 字段值转数字（无法转换返回null）
 */
window.BilibiliSubtitle.parseNumber = function(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const num = Number(value.trim())
    return Number.isFinite(num) ? num : null
  }
  return null
}

/**
 * 生成字幕项稳定标识，避免大整数ID精度问题
 */
window.BilibiliSubtitle.getSubtitleOptionValue = function(subtitle) {
  if (!subtitle) return ''
  if (subtitle.id_str) return `id_str:${subtitle.id_str}`
  if (subtitle.id !== undefined && subtitle.id !== null) return `id:${String(subtitle.id)}`
  return `lan:${subtitle.lan || ''}|url:${subtitle.subtitle_url || ''}`
}

/**
 * 获取可用于匹配字幕来源提示的候选键
 */
window.BilibiliSubtitle.getSubtitleHintKeys = function(subtitle) {
  if (!subtitle) return []

  const keys = []
  if (subtitle.id_str) {
    keys.push(`id_str:${subtitle.id_str}`)
  }
  if (subtitle.id !== undefined && subtitle.id !== null) {
    keys.push(`id:${String(subtitle.id)}`)
  }
  if (subtitle.lan && subtitle.type !== undefined && subtitle.type !== null) {
    keys.push(`lan_type:${subtitle.lan}|${String(subtitle.type)}`)
  }
  if (subtitle.lan) {
    keys.push(`lan:${subtitle.lan}`)
  }

  return keys
}

/**
 * 构建字幕来源提示映射（来自 view 接口 subtitle.list）
 */
window.BilibiliSubtitle.buildSubtitleHintMap = function(referenceList) {
  const hintMap = new Map()
  if (!Array.isArray(referenceList)) return hintMap

  referenceList.forEach((item) => {
    const keys = window.BilibiliSubtitle.getSubtitleHintKeys(item)
    keys.forEach((key) => hintMap.set(key, item))
  })

  return hintMap
}

/**
 * 将来源提示信息挂载到字幕列表项
 */
window.BilibiliSubtitle.attachSubtitleSourceHints = function(subtitleList, referenceList) {
  if (!Array.isArray(subtitleList)) return []
  const hintMap = window.BilibiliSubtitle.buildSubtitleHintMap(referenceList)

  return subtitleList.map((subtitle) => {
    const keys = window.BilibiliSubtitle.getSubtitleHintKeys(subtitle)
    const sourceHint = keys.map((key) => hintMap.get(key)).find((item) => !!item) || null
    return {
      ...subtitle,
      source_hint: sourceHint
    }
  })
}

/**
 * 解析类布尔值字段（兼容字符串/数字/布尔等多种形态）
 * 返回 true/false，无法解析时返回 null
 */
window.BilibiliSubtitle.parseBoolLike = function(value) {
  if (value === true || value === false) return value
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value > 0 : null
  }
  if (typeof value === 'string') {
    const t = value.trim().toLowerCase()
    if (t === 'true') return true
    if (t === 'false') return false
    const n = Number(t)
    if (Number.isFinite(n)) return n > 0
  }
  return null
}

/**
 * 基于字幕字段判断来源
 */
window.BilibiliSubtitle.detectSubtitleSourceByFields = function(subtitle) {
  if (!subtitle) return window.BilibiliSubtitle.SUBTITLE_SOURCE.UNKNOWN

  const s = subtitle
  const SOURCE = window.BilibiliSubtitle.SUBTITLE_SOURCE

  if ([SOURCE.HUMAN, SOURCE.AI, SOURCE.UNKNOWN].includes(s.source)) {
    return s.source
  }

  const n = window.BilibiliSubtitle.parseNumber

  if (n(s.type) === 1) return SOURCE.AI
  if (n(s.type) === 0) return SOURCE.HUMAN
  if (n(s.ai_status) > 0 || n(s.ai_type) > 0) return SOURCE.AI

  if ((s.lan || '').toLowerCase().startsWith('ai-')) return SOURCE.AI

  const url = (s.subtitle_url || '').toLowerCase()
  if (['aisubtitle.hdslb.com', '/ai_subtitle/', '/aisubtitle/'].some(k => url.includes(k))) {
    return SOURCE.AI
  }

  const boolFields = ['is_ai', 'is_ai_subtitle', 'is_machine']
  const signals = boolFields
    .map(f => window.BilibiliSubtitle.parseBoolLike(s[f]))
    .filter(v => v !== null)

  if (signals.includes(true)) return SOURCE.AI
  if (signals.length > 0 && signals.every(v => v === false)) {
    return SOURCE.HUMAN
  }

  return SOURCE.UNKNOWN
}

/**
 * 基于接口响应字段判断字幕来源
 */
window.BilibiliSubtitle.getSubtitleSource = function(subtitle) {
  if (!subtitle) return window.BilibiliSubtitle.SUBTITLE_SOURCE.UNKNOWN

  const selfSource = window.BilibiliSubtitle.detectSubtitleSourceByFields(subtitle)
  if (selfSource !== window.BilibiliSubtitle.SUBTITLE_SOURCE.UNKNOWN) {
    return selfSource
  }

  if (subtitle.source_hint) {
    return window.BilibiliSubtitle.detectSubtitleSourceByFields(subtitle.source_hint)
  }

  return window.BilibiliSubtitle.SUBTITLE_SOURCE.UNKNOWN
}

/**
 * 判断是否为AI字幕
 */
window.BilibiliSubtitle.isAiSubtitle = function(subtitle) {
  return window.BilibiliSubtitle.getSubtitleSource(subtitle) === window.BilibiliSubtitle.SUBTITLE_SOURCE.AI
}

/**
 * 标准化字幕来源字段
 */
window.BilibiliSubtitle.normalizeSubtitleList = function(subtitleList) {
  if (!Array.isArray(subtitleList)) return []
  return subtitleList.map((subtitle) => ({
    ...subtitle,
    source: window.BilibiliSubtitle.getSubtitleSource(subtitle)
  }))
}

/**
 * 将人工字幕排在前，AI排在后，未知居中；保持组内原始顺序
 */
window.BilibiliSubtitle.sortSubtitleList = function(subtitleList) {
  if (!Array.isArray(subtitleList)) return []

  const sourceOrder = {
    [window.BilibiliSubtitle.SUBTITLE_SOURCE.HUMAN]: 0,
    [window.BilibiliSubtitle.SUBTITLE_SOURCE.UNKNOWN]: 1,
    [window.BilibiliSubtitle.SUBTITLE_SOURCE.AI]: 2
  }

  return subtitleList
    .map((subtitle, index) => ({ subtitle, index }))
    .sort((a, b) => {
      const aSource = window.BilibiliSubtitle.getSubtitleSource(a.subtitle)
      const bSource = window.BilibiliSubtitle.getSubtitleSource(b.subtitle)
      const aScore = sourceOrder[aSource] ?? 1
      const bScore = sourceOrder[bSource] ?? 1

      if (aScore !== bScore) {
        return aScore - bScore
      }

      return a.index - b.index
    })
    .map((item) => item.subtitle)
}

/**
 * 选择默认字幕：优先人工中文字幕，再人工任意语种，再未知，最后AI
 */
window.BilibiliSubtitle.pickDefaultSubtitle = function(subtitleList) {
  if (!subtitleList || subtitleList.length === 0) return null

  const humanZhSubtitle = subtitleList.find((s) => s.lan === 'zh-CN' && window.BilibiliSubtitle.getSubtitleSource(s) === window.BilibiliSubtitle.SUBTITLE_SOURCE.HUMAN)
  const humanSubtitle = subtitleList.find((s) => window.BilibiliSubtitle.getSubtitleSource(s) === window.BilibiliSubtitle.SUBTITLE_SOURCE.HUMAN)
  const unknownZhSubtitle = subtitleList.find((s) => s.lan === 'zh-CN' && window.BilibiliSubtitle.getSubtitleSource(s) === window.BilibiliSubtitle.SUBTITLE_SOURCE.UNKNOWN)
  const unknownSubtitle = subtitleList.find((s) => window.BilibiliSubtitle.getSubtitleSource(s) === window.BilibiliSubtitle.SUBTITLE_SOURCE.UNKNOWN)
  const zhSubtitle = subtitleList.find((s) => s.lan === 'zh-CN')

  return humanZhSubtitle || humanSubtitle || unknownZhSubtitle || unknownSubtitle || zhSubtitle || subtitleList[0]
}

/**
 * 生成下拉显示文案（语言 + 来源）
 */
window.BilibiliSubtitle.getSubtitleDisplayName = function(subtitle) {
  const languageName = subtitle?.lan_doc || subtitle?.lan || '未知语言'
  const source = window.BilibiliSubtitle.getSubtitleSource(subtitle)
  const sourceLabelMap = {
    [window.BilibiliSubtitle.SUBTITLE_SOURCE.HUMAN]: '人工',
    [window.BilibiliSubtitle.SUBTITLE_SOURCE.AI]: 'AI',
    [window.BilibiliSubtitle.SUBTITLE_SOURCE.UNKNOWN]: '未知'
  }
  const sourceLabel = sourceLabelMap[source] || '未知'
  return `${languageName}（${sourceLabel}）`
}

/**
 * 通过API获取并显示字幕
 *
 * 执行流程：提取BVID → 获取视频信息(aid/cid) → 获取字幕列表 → 加载字幕内容
 * 不依赖模拟点击和拦截，直接调用B站API
 */
window.BilibiliSubtitle.fetchSubtitleByAPI = async function() {
  window.BilibiliSubtitle.logInfo('[API] 开始获取字幕')

  // 防止重复调用
  if (window.BilibiliSubtitle.isLoading) {
    window.BilibiliSubtitle.logDebug('[API] 正在加载中，跳过重复调用')
    return
  }
  
  window.BilibiliSubtitle.isLoading = true
  window.BilibiliSubtitle.updateSubtitleSelector(null, null, window.BilibiliSubtitle.SUBTITLE_SELECTOR_STATES.LOADING)

  if (window.BilibiliSubtitle.setEmptyState) {
    window.BilibiliSubtitle.setEmptyState(window.BilibiliSubtitle.EMPTY_STATES.LOADING)
  }

  const danmukuBox = document.getElementById('danmukuBox')
  if (!danmukuBox) {
    window.BilibiliSubtitle.logError('[API] 未找到danmukuBox容器')
    window.BilibiliSubtitle.updateSubtitleSelector(null, null, window.BilibiliSubtitle.SUBTITLE_SELECTOR_STATES.ERROR)
    window.BilibiliSubtitle.isLoading = false
    if (window.BilibiliSubtitle.setEmptyState) {
      window.BilibiliSubtitle.setEmptyState(window.BilibiliSubtitle.EMPTY_STATES.ERROR)
    }
    return
  }

  try {
    const bvid = window.BilibiliSubtitle.getBVID()
    if (!bvid) {
      window.BilibiliSubtitle.logError('[API] 无法获取BVID')
      window.BilibiliSubtitle.updateSubtitleSelector(null, null, window.BilibiliSubtitle.SUBTITLE_SELECTOR_STATES.ERROR)
      window.BilibiliSubtitle.isLoading = false
      if (window.BilibiliSubtitle.setEmptyState) {
        window.BilibiliSubtitle.setEmptyState(window.BilibiliSubtitle.EMPTY_STATES.ERROR)
      }
      return
    }

    const videoInfo = await window.BilibiliSubtitle.fetchVideoInfoByAPI(bvid)
    const { aid, cid } = videoInfo

    const subtitleList = await window.BilibiliSubtitle.fetchSubtitleListByAPI(aid, cid)
    const viewSubtitleList = videoInfo?.subtitle?.list || []

    if (!subtitleList || subtitleList.length === 0) {
      window.BilibiliSubtitle.logInfo('[API] 该视频无字幕')
      window.BilibiliSubtitle.displaySubtitles([], window.BilibiliSubtitle.EMPTY_STATES.NO_SUBTITLE)
      window.BilibiliSubtitle.subtitleListCache = null
      window.BilibiliSubtitle.updateSubtitleSelector(
        null,
        null,
        window.BilibiliSubtitle.SUBTITLE_SELECTOR_STATES.NO_SUBTITLE
      )
      window.BilibiliSubtitle.isLoading = false
      return
    }

    const subtitleListWithHints = window.BilibiliSubtitle.attachSubtitleSourceHints(subtitleList, viewSubtitleList)
    const normalizedSubtitleList = window.BilibiliSubtitle.normalizeSubtitleList(subtitleListWithHints)
    const sourceSummary = normalizedSubtitleList.reduce((acc, subtitle) => {
      const source = subtitle.source || window.BilibiliSubtitle.SUBTITLE_SOURCE.UNKNOWN
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {})
    window.BilibiliSubtitle.logDebug('[API] 字幕来源统计:', sourceSummary)

    const unknownSample = normalizedSubtitleList.find(
      (subtitle) => subtitle.source === window.BilibiliSubtitle.SUBTITLE_SOURCE.UNKNOWN
    )
    if (unknownSample) {
      window.BilibiliSubtitle.logDebug('[API] 未知来源字幕样例:', {
        id: unknownSample.id,
        id_str: unknownSample.id_str,
        lan: unknownSample.lan,
        type: unknownSample.type,
        ai_type: unknownSample.ai_type,
        ai_status: unknownSample.ai_status,
        is_ai: unknownSample.is_ai,
        is_ai_subtitle: unknownSample.is_ai_subtitle,
        subtitle_url: unknownSample.subtitle_url,
        source_hint: unknownSample.source_hint
          ? {
              id: unknownSample.source_hint.id,
              id_str: unknownSample.source_hint.id_str,
              lan: unknownSample.source_hint.lan,
              type: unknownSample.source_hint.type,
              ai_type: unknownSample.source_hint.ai_type,
              ai_status: unknownSample.source_hint.ai_status
            }
          : null
      })
    }

    // 人工字幕优先排序后缓存
    const sortedSubtitleList = window.BilibiliSubtitle.sortSubtitleList(normalizedSubtitleList)
    window.BilibiliSubtitle.subtitleListCache = sortedSubtitleList

    const defaultSubtitle = window.BilibiliSubtitle.pickDefaultSubtitle(sortedSubtitleList)
    const defaultSubtitleOptionValue = defaultSubtitle
      ? window.BilibiliSubtitle.getSubtitleOptionValue(defaultSubtitle)
      : null

    // 更新字幕选择器
    window.BilibiliSubtitle.updateSubtitleSelector(sortedSubtitleList, defaultSubtitleOptionValue)

    const subtitles = defaultSubtitle
      ? await window.BilibiliSubtitle.fetchSubtitleContentByAPI(defaultSubtitle.subtitle_url)
      : []

    window.BilibiliSubtitle.logInfo('[API] 字幕加载完成')

    const displayState = subtitles && subtitles.length > 0
      ? null
      : window.BilibiliSubtitle.EMPTY_STATES.NO_SUBTITLE
    window.BilibiliSubtitle.displaySubtitles(subtitles || [], displayState)
    window.BilibiliSubtitle.isLoading = false
  } catch (error) {
    window.BilibiliSubtitle.logError('[API] 获取字幕失败:', error)
    window.BilibiliSubtitle.updateSubtitleSelector(null, null, window.BilibiliSubtitle.SUBTITLE_SELECTOR_STATES.ERROR)
    if (window.BilibiliSubtitle.setEmptyState) {
      window.BilibiliSubtitle.setEmptyState(window.BilibiliSubtitle.EMPTY_STATES.ERROR)
    }
    window.BilibiliSubtitle.isLoading = false
  }
}

/**
 * [API] 选择指定字幕并显示
 */
window.BilibiliSubtitle.selectSubtitle = async function(subtitle) {
  if (!subtitle) return

  try {
    if (window.BilibiliSubtitle.setEmptyState) {
      window.BilibiliSubtitle.setEmptyState(window.BilibiliSubtitle.EMPTY_STATES.LOADING)
    }
    const subtitles = await window.BilibiliSubtitle.fetchSubtitleContentByAPI(subtitle.subtitle_url)
    const displayState = subtitles && subtitles.length > 0
      ? null
      : window.BilibiliSubtitle.EMPTY_STATES.NO_SUBTITLE
    window.BilibiliSubtitle.displaySubtitles(subtitles || [], displayState)
  } catch (error) {
    window.BilibiliSubtitle.logError('[API] 切换字幕失败:', error)
    if (window.BilibiliSubtitle.setEmptyState) {
      window.BilibiliSubtitle.setEmptyState(window.BilibiliSubtitle.EMPTY_STATES.ERROR)
    }
  }
}

/**
 * [API] 更新字幕选择器
 */
window.BilibiliSubtitle.updateSubtitleSelector = function(subtitleList, selectedId, stateKey) {
  const wrapper = document.getElementById('bilibili-subtitle-wrapper')
  if (!wrapper) return

  const select = wrapper.querySelector('#subtitleSelector')
  if (!select) return

  select.innerHTML = ''

  if (!subtitleList || subtitleList.length === 0) {
    const fallbackState = stateKey || window.BilibiliSubtitle.SUBTITLE_SELECTOR_STATES.IDLE
    window.BilibiliSubtitle.setSubtitleSelectorState(fallbackState)
    return
  }

  select.disabled = false

  const placeholderOption = document.createElement('option')
  placeholderOption.value = ''
  placeholderOption.textContent = '切换字幕'
  select.appendChild(placeholderOption)

  subtitleList.forEach(subtitle => {
    const option = document.createElement('option')
    option.value = window.BilibiliSubtitle.getSubtitleOptionValue(subtitle)
    option.textContent = window.BilibiliSubtitle.getSubtitleDisplayName(subtitle)
    select.appendChild(option)
  })

  if (selectedId !== null && selectedId !== undefined && selectedId !== '') {
    select.value = String(selectedId)
  }
}
