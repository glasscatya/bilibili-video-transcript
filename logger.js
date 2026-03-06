/**
 * 日志工具模块
 * 支持日志级别控制，生产环境可禁用低级别日志
 */

window.BilibiliSubtitle = window.BilibiliSubtitle || {}

/**
 * 日志级别枚举
 * @readonly
 * @enum {number}
 */
window.BilibiliSubtitle.LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 99
}

/**
 * 当前日志级别配置
 * 开发环境建议使用 DEBUG，生产环境建议使用 WARN
 */
window.BilibiliSubtitle.CURRENT_LOG_LEVEL = window.BilibiliSubtitle.LogLevel.DEBUG

/**
 * 日志前缀配置
 */
const LOG_PREFIX = {
  DEBUG: '[DEBUG]',
  INFO: '[INFO]',
  WARN: '[WARN]',
  ERROR: '[ERROR]'
}

/**
 * 检查是否应输出该级别日志
 * @param {number} level - 日志级别
 * @returns {boolean}
 */
function shouldLog(level) {
  return level >= window.BilibiliSubtitle.CURRENT_LOG_LEVEL
}

/**
 * 输出调试日志（仅开发环境）
 * @param {...any} args - 日志内容
 */
window.BilibiliSubtitle.logDebug = function(...args) {
  if (shouldLog(window.BilibiliSubtitle.LogLevel.DEBUG)) {
    console.log(LOG_PREFIX.DEBUG, ...args)
  }
}

/**
 * 输出信息日志
 * @param {...any} args - 日志内容
 */
window.BilibiliSubtitle.logInfo = function(...args) {
  if (shouldLog(window.BilibiliSubtitle.LogLevel.INFO)) {
    console.log(LOG_PREFIX.INFO, ...args)
  }
}

/**
 * 输出警告日志
 * @param {...any} args - 日志内容
 */
window.BilibiliSubtitle.logWarn = function(...args) {
  if (shouldLog(window.BilibiliSubtitle.LogLevel.WARN)) {
    console.warn(LOG_PREFIX.WARN, ...args)
  }
}

/**
 * 输出错误日志（始终输出）
 * @param {...any} args - 日志内容
 */
window.BilibiliSubtitle.logError = function(...args) {
  if (shouldLog(window.BilibiliSubtitle.LogLevel.ERROR)) {
    console.error(LOG_PREFIX.ERROR, ...args)
  }
}

/**
 * 设置日志级别
 * @param {number} level - 日志级别
 */
window.BilibiliSubtitle.setLogLevel = function(level) {
  window.BilibiliSubtitle.CURRENT_LOG_LEVEL = level
}
