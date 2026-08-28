/*
 * @Author: trexwb
 * @Date: 2026-01-22 11:07:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-05-07 11:14:29
 * @FilePath: node-laravel/src/app/Helpers/format.ts
 * @Description: 日期格式化工具
 *
 * ⚠️ 时区语义说明：
 * - dayjs.tz(Date, TZ)：将 Date 的 UTC 内部毫秒值 **当作** TZ 时区的本地时间 → 仅用于无时区字符串
 * - dayjs(Date).tz(TZ)：将 Date 的 UTC 内部毫秒值 **正确解释为 UTC**，再转换到 TZ
 * - dayjs.tz(raw, fmt, TZ)：解析无时区字符串为 TZ 时区的本地时间 → 用于 DATETIME 字符串
 * - dayjs(raw).tz(TZ)：将字符串先当 UTC 解析，再转换到 TZ → 用于 ISO/UTC 字符串
 *
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * 应用默认时区（硬编码）
 * ⚠️ 不依赖 config('app.timezone')，避免模块初始化顺序问题
 */
export const DEFAULT_TIME_ZONE = 'Asia/Shanghai'

// 强制设置 dayjs 默认时区
dayjs.tz.setDefault(DEFAULT_TIME_ZONE)

/** 获取应用时区 */
export const getAppTimezone = (): string => DEFAULT_TIME_ZONE

/** 获取当前时间（应用时区 dayjs 对象） */
export const now = (): dayjs.Dayjs => {
  try {
    return dayjs().tz(DEFAULT_TIME_ZONE)
  } catch {
    return dayjs()
  }
}

/** 获取当前 Date 对象 */
export const nowDate = (): Date => {
  try {
    return dayjs().tz(DEFAULT_TIME_ZONE).toDate()
  } catch {
    return new Date()
  }
}

// ─── 内部共享 ─────────────────────────────────────────────────────────────────

/**
 * 安全调用 dayjs 实例的 .tz() 方法
 * ⚠️ dayjs(invalidDate).tz(TZ) 会抛 RangeError: Invalid time value，
 *    必须在调用 .tz() 之前检查 isValid()，并用 try/catch 兜底。
 */
function safeTz(d: dayjs.Dayjs, tz: string = DEFAULT_TIME_ZONE): dayjs.Dayjs {
  if (!d.isValid()) return d
  try {
    return d.tz(tz)
  } catch {
    return d
  }
}

/**
 * 安全调用 dayjs.tz() 静态方法（解析字符串）
 * ⚠️ dayjs.tz(invalidString, TZ) 也会抛 RangeError: Invalid time value
 */
function safeTzParse(raw: string, tz: string = DEFAULT_TIME_ZONE): dayjs.Dayjs {
  try {
    return dayjs.tz(raw, tz)
  } catch {
    return dayjs(NaN)
  }
}

/** 安全格式化 */
function safeFormat(d: dayjs.Dayjs, formatString: string): string {
  try {
    return d.isValid() ? d.format(formatString) : fallback(formatString)
  } catch {
    return fallback(formatString)
  }
}

/** 空输入兜底 */
function fallback(formatString: string): string {
  try {
    return dayjs().tz(DEFAULT_TIME_ZONE).format(formatString)
  } catch {
    return dayjs().format(formatString)
  }
}

// ─── 公开 API ─────────────────────────────────────────────────────────────────

/**
 * 格式化日期为字符串
 *
 * 适用场景：处理 **应用时区** 的时间输入
 * - Date 对象：UTC 内部值 → 转换到北京时间
 * - 数字时间戳：当作 UTC 毫秒 → 转换到北京时间
 * - DATETIME 字符串（无时区）：直接解析为北京时间
 * - ISO 字符串（含 Z/UTC）：先当 UTC 解析 → 转换到北京时间
 *
 * @param input 输入时间，null 时返回当前时间
 * @param formatString 格式，默认 'YYYY-MM-DD HH:mm:ss'
 */
export const formatDate = (input: Date | string | number | null = null, formatString: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!input) return fallback(formatString)

  if (input instanceof Date) {
    if (isNaN(input.getTime())) return fallback(formatString)
    return safeFormat(safeTz(dayjs(input)), formatString)
  }

  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return fallback(formatString)
    return safeFormat(safeTz(dayjs(input)), formatString)
  }

  const raw = String(input).trim()
  if (!raw) return fallback(formatString)

  // DATETIME 格式 "YYYY-MM-DD HH:mm:ss"（无时区，存的是北京时间）
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) {
    return safeFormat(safeTzParse(raw), formatString)
  }

  // ISO/UTC 字符串（含 Z 或时区偏移）
  if (raw.endsWith('Z') || /^\d{4}-\d{2}-\d{2}T/.test(raw) || /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+\-]\d{2}:?\d{2}$/.test(raw)) {
    return safeFormat(safeTz(dayjs.utc(raw)), formatString)
  }

  // 其他格式：尝试解析
  return safeFormat(safeTzParse(raw), formatString)
}

/**
 * 格式化日期为 MySQL DATETIME 格式（YYYY-MM-DD HH:mm:ss）
 * 用于写入数据库时间字段
 */
export const formatDbDateTime = (input: Date | string | number | null = null): string => {
  return formatDate(input, 'YYYY-MM-DD HH:mm:ss')
}

/**
 * 从 UTC Date 对象格式化为数据库 DATETIME 字符串
 * ⚠️ 专用于读取 DB TIMESTAMP 字段后的转换：
 *   DB TIMESTAMP(3) WITH TIME ZONE → MySQL 驱动返回 JS Date（UTC 内部值）
 *   → 用 dayjs(Date).tz() 正确转换到北京时间
 */
export const formatDbDateTimeFromUTC = (input: Date | string | number | null = null): string => {
  return formatDateFromUTC(input, 'YYYY-MM-DD HH:mm:ss')
}

/**
 * 将 UTC 时间（包括 Date、数字时间戳、ISO 字符串）转换为应用时区
 *
 * 适用场景：
 * - 读取 DB TIMESTAMP 列后的 Date 对象
 * - 外部 API 返回的 ISO/UTC 时间字符串
 * - 任何需要从 UTC 转换到北京时间的情况
 *
 * ⚠️ 不适用于 DATETIME 字符串（它们存的就是北京时间，直接返回即可）
 */
export const formatDateFromUTC = (input: Date | string | number | null = null, formatString: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!input) return fallback(formatString)

  if (input instanceof Date) {
    if (isNaN(input.getTime())) return fallback(formatString)
    // Date 对象内部值是 UTC，先用 dayjs.utc() 正确解释，再 .tz() 转换到北京时间
    return safeFormat(safeTz(dayjs.utc(input)), formatString)
  }

  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return fallback(formatString)
    // 时间戳是 UTC 毫秒，同上
    return safeFormat(safeTz(dayjs.utc(input)), formatString)
  }

  const raw = String(input).trim()
  if (!raw) return fallback(formatString)

  // DATETIME 格式（无时区，存的是北京时间）：优先判断，避免被下面的 ISO 正则误匹配
  // ⚠️ /^[+\-]?\d/ 会匹配 '2026-05-13 17:59:00'（以数字 2 开头），导致误走 dayjs.utc()
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) {
    return raw
  }

  // ISO/UTC 字符串（含 Z）
  if (raw.endsWith('Z') || /^[+\-]?\d/.test(raw)) {
    return safeFormat(safeTz(dayjs.utc(raw)), formatString)
  }

  return safeFormat(safeTzParse(raw), formatString)
}

/**
 * 仅格式化输出，不做时区转换
 *
 * 适用场景：
 * - 输入已经是目标时区的时间，只需要统一输出格式
 * - 不论输入是 UTC 还是本地时间，都按原样格式化
 *
 * ⚠️ 对于 Date 对象和数字时间戳，会按本地/系统时区输出
 * ⚠️ 对于 ISO 字符串，会按 UTC 时区输出
 */
export const formatAsIs = (input: Date | string | number | null = null, formatString: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!input) return dayjs().format(formatString)

  if (input instanceof Date) {
    if (isNaN(input.getTime())) return dayjs().format(formatString)
    return dayjs(input).format(formatString)
  }

  if (typeof input === 'number') {
    return dayjs(input).format(formatString)
  }

  const raw = String(input).trim()
  if (!raw) return dayjs().format(formatString)

  // ISO/UTC 字符串：先当 UTC 解析（.utc()），再格式化（输出不带时区）
  if (raw.endsWith('Z') || /^[+\-]?\d/.test(raw)) {
    return dayjs.utc(raw).format(formatString)
  }

  // DATETIME 格式或其他：直接格式化
  return dayjs(raw).format(formatString)
}

/**
 * 当前时间 + seconds（秒）后的 MySQL DATETIME 格式
 */
export const addSecondsDbDateTime = (
  seconds: number,
  base: Date | string | number | null = null,
  formatString: string = 'YYYY-MM-DD HH:mm:ss'
): string => {
  const sec = Number.isFinite(Number(seconds)) ? Number(seconds) : 0

  let baseTime: dayjs.Dayjs
  if (!base) {
    baseTime = now()
  } else if (base instanceof Date) {
    baseTime = isNaN(base.getTime()) ? now() : safeTz(dayjs(base))
  } else if (typeof base === 'number') {
    if (!Number.isFinite(base)) {
      baseTime = now()
    } else {
      baseTime = safeTz(dayjs(base))
    }
  } else {
    const raw = String(base).trim()
    if (!raw) {
      baseTime = now()
    } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) {
      // DATETIME：已是北京时间，先解析再加秒
      baseTime = safeTzParse(raw)
    } else if (raw.endsWith('Z') || /^[+\-]?\d/.test(raw)) {
      // ISO：先当 UTC 解析
      baseTime = safeTz(dayjs.utc(raw))
    } else {
      baseTime = safeTzParse(raw)
    }
  }

  return baseTime.add(sec, 'second').format(formatString)
}

/**
 * 解析 DATETIME 字符串为 Date 对象
 * ⚠️ 数据库 timezone='+08:00'，字符串已是北京时间，解析后返回 UTC Date
 */
export const parseDbDateTime = (input: Date | string | number | null = null): Date => {
  if (!input) return nowDate()

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? nowDate() : input
  }

  if (typeof input === 'number') return new Date(input)

  const raw = String(input).trim()
  if (!raw) return nowDate()

  // DATETIME 格式：北京时间 → 转 UTC Date
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) {
    const parsed = safeTzParse(raw)
    return parsed.isValid() ? parsed.utc().toDate() : nowDate()
  }

  // ISO/UTC 字符串
  if (raw.endsWith('Z') || /^[+\-]?\d/.test(raw)) {
    const parsed = safeTz(dayjs.utc(raw))
    return parsed.isValid() ? parsed.toDate() : nowDate()
  }

  const parsed = safeTzParse(raw)
  return parsed.isValid() ? parsed.toDate() : nowDate()
}

/** 格式化货币金额（人民币） */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount)
}

/**
 * UTC 时间转换为应用时区 Date
 * 用于处理外部 API 返回的 UTC 时间
 */
export const utcToLocal = (input: Date | string | number | null = null): Date => {
  if (!input) return nowDate()
  return safeTz(dayjs.utc(input)).toDate()
}

/**
 * 应用时区时间转换为 UTC Date
 * 用于发送给外部 API（需要 UTC 时间）
 */
export const localToUtc = (input: Date | string | number | null = null): Date => {
  if (!input) return new Date()
  return safeTz(dayjs(input)).utc().toDate()
}

/** 获取当前时区名称（兼容旧接口） */
export const getTimezone = (): string => DEFAULT_TIME_ZONE

export default dayjs
