/*
 * @Author: trexwb
 * @Date: 2026-03-24 09:49:16
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-24 16:30:26
 * @FilePath: node-laravel/src/app/Helpers/validation.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

/**
 * 检查值是否为空
 * @param value - 需要检查的值
 * @returns 是否为空
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && trim(value) === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  if (typeof value === 'object' && Object.keys(value).length === 0) return true
  return false
}

/**
 * 去左右空格
 */
const trim = (value: string): string => {
  return value.replace(/(^\s*)|(\s*$)/g, '')
}

/**
 * 安全转换为整数
 * @param value - 需要转换的值
 * @returns 安全的整数值
 */
export const toSafeInteger = (value: unknown): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return Number.isInteger(value) ? value : Math.floor(value)
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : Math.floor(parsed)
  }
  return 0
}

/**
 * 安全转换为浮点数
 * @param value - 需要转换的值
 * @param decimals - 保留小数位数（可选）
 * @returns 安全的浮点数值
 */
export const toSafeFloat = (value: unknown, decimals?: number): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return decimals !== undefined ? Number(value.toFixed(decimals)) : value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = parseFloat(value)
    const result = isNaN(parsed) ? 0 : parsed
    return decimals !== undefined ? Number(result.toFixed(decimals)) : result
  }
  return 0
}

/**
 * 安全转换为布尔值
 * @param value - 需要转换的值
 * @param strict - 是否严格模式（默认 false）
 * @returns 安全的布尔值
 */
export const toSafeBoolean = (value: unknown, strict: boolean = false): boolean => {
  if (typeof value === 'boolean') return value

  if (strict) {
    return value === true || value === 'true' || value === 1 || value === '1'
  }

  // 宽松模式：非空即为 true
  return !isEmpty(value)
}

/**
 * 过滤对象中的空值（null, undefined, 空字符串）
 * @param obj - 需要过滤的对象
 * @param options - 过滤选项
 * @returns 过滤后的新对象
 */
export const filterEmptyValues = <T extends Record<string, unknown>>(
  obj: T,
  options?: {
    /** 是否递归过滤嵌套对象 */
    recursive?: boolean
    /** 是否将 0 视为空值 */
    treatZeroAsEmpty?: boolean
    /** 自定义空值判断函数 */
    customIsEmpty?: (value: unknown) => boolean
  }
): Partial<T> => {
  const { recursive = false, treatZeroAsEmpty = false, customIsEmpty } = options ?? {}

  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    // 使用自定义判断函数
    if (customIsEmpty?.(value)) {
      continue
    }

    // 基础空值判断
    if (value === null || value === undefined) {
      continue
    }

    // 空字符串
    if (typeof value === 'string' && value.trim() === '') {
      continue
    }

    // 零值处理
    if (typeof value === 'number' && value === 0 && treatZeroAsEmpty) {
      continue
    }

    // 递归处理嵌套对象
    if (recursive && value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = filterEmptyValues(value as Record<string, unknown>, options)
    } else {
      result[key] = value
    }
  }

  return result as Partial<T>
}

/**
 * 规范化排序参数
 * @param sort - 排序字符串（如 "+name" 或 "-created_at"）
 * @param allowedColumns - 允许的列名白名单
 * @returns 排序配置对象
 */
export const normalizeSort = (
  sort: string | undefined,
  allowedColumns: string[]
): { column: string; order: 'ASC' | 'DESC' } | undefined => {
  if (!sort) return undefined

  const match = sort.match(/^([+-])(.*?)$/)
  if (!match) return undefined

  const [, direction, column] = match
  if (!allowedColumns.includes(column)) {
    return undefined
  }

  return {
    column,
    order: direction === '-' ? 'DESC' : 'ASC',
  }
}

/**
 * 验证邮箱格式
 * @param email - 邮箱地址
 * @returns 是否为有效邮箱
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证手机号格式（中国大陆）
 * @param mobile - 手机号码
 * @returns 是否为有效手机号
 */
export const isValidMobile = (mobile: string | number): boolean => {
  const strMobile = mobile.toString()
  const mobileRegex = /^1[3-9]\d{9}$/
  return mobileRegex.test(strMobile)
}

/**
 * 验证身份证号格式（中国大陆）
 * @param idCard - 身份证号
 * @returns 是否为有效身份证号
 */
export const isValidIdCard = (idCard: string): boolean => {
  if (!idCard || typeof idCard !== 'string') return false

  // 18 位身份证号验证
  const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
  return idCardRegex.test(idCard)
}

/**
 * 验证 URL 格式
 * @param url - URL 地址
 * @returns 是否为有效 URL
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证金额格式（正数，最多 2 位小数）
 * @param amount - 金额
 * @returns 是否为有效金额
 */
export const isValidAmount = (amount: string | number): boolean => {
  const numAmount = toSafeFloat(amount, 2)
  return numAmount >= 0
}

/**
 * 数组去重合并
 * @param arr1 - 第一个数组
 * @param arr2 - 第二个数组（可选）
 * @returns 去重后的新数组
 */
export const mergeUnique = <T>(arr1: T[], arr2?: T[]): T[] => {
  const combined = arr2 ? [...arr1, ...arr2] : arr1
  return [...new Set(combined)]
}

/**
 * 驼峰命名转下划线命名
 * @param str - 驼峰命名字符串
 * @returns 下划线命名的字符串
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * 下划线命名转驼峰命名
 * @param str - 下划线命名字符串
 * @returns 驼峰命名的字符串
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * 对象键名转换（驼峰转下划线）
 * @param obj - 需要转换的对象
 * @returns 转换后的新对象
 */
export const convertKeysToSnake = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key)
    result[snakeKey] = value
  }

  return result
}

/**
 * 对象键名转换（下划线转驼峰）
 * @param obj - 需要转换的对象
 * @returns 转换后的新对象
 */
export const convertKeysToCamel = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key)
    result[camelKey] = value
  }

  return result
}
