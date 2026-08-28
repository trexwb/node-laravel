/*
 * @Author: trexwb
 * @Date: 2026-03-24
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-02
 * @FilePath: node-laravel/src/app/Helpers/string.ts
 * @Description:
 * 字符串处理工具类（整合了 StrHelper 和 string 的所有功能）
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

import { randomBytes } from 'node:crypto'
import Utils from '#app/Helpers/index'
import type { SanitizeOptions } from '#types/helpers'
export type { SanitizeOptions } from '#types/helpers'

/**
 * 敏感字段配置接口
 */

/**
 * 默认的敏感字段列表
 */
const DEFAULT_SENSITIVE_FIELDS = ['password', 'salt', 'secret', 'rememberToken', 'remember_token'] as const

/**
 * 过滤敏感字段（用于 Controller 层数据脱敏）
 * @param data - 需要处理的数据（对象或数组）
 * @param options - 脱敏配置
 * @returns 脱敏后的数据
 */
export const sanitize = <T extends Record<string, unknown> | unknown[]>(data: T, options?: SanitizeOptions): T => {
  const fieldsToRemove = options?.fields ?? DEFAULT_SENSITIVE_FIELDS
  const recursive = options?.recursive ?? true

  // 处理数组
  if (Array.isArray(data)) {
    return data.map((item) => (typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>, fieldsToRemove, recursive) : item)) as T
  }

  // 处理单个对象
  return sanitizeObject(data, fieldsToRemove, recursive) as T
}

/**
 * 过滤对象中的敏感字段
 * @param obj - 需要处理的对象
 * @param fieldsToRemove - 需要移除的字段列表
 * @param recursive - 是否递归处理
 * @returns 过滤后的新对象
 */
const sanitizeObject = <T extends Record<string, unknown>>(obj: T, fieldsToRemove: readonly string[], recursive: boolean): T => {
  if (!obj || typeof obj !== 'object') return obj

  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    // 跳过需要移除的字段
    if (fieldsToRemove.includes(key)) {
      continue
    }

    // 递归处理嵌套对象
    if (recursive && value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as T, fieldsToRemove, recursive)
    } else if (recursive && Array.isArray(value)) {
      sanitized[key] = value.map((item) => (typeof item === 'object' ? sanitizeObject(item as T, fieldsToRemove, recursive) : item))
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as T
}

/**
 * 生成随机字符串
 * @param length - 字符串长度
 * @param charset - 字符集（可选）
 * @returns 随机字符串
 */
export const randomString = (length: number = 6, charset?: string): string => {
  const characters = charset ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  // 使用密码学安全随机数，避免 Math.random() 可预测风险（rememberToken / secret / salt 等安全令牌均依赖此函数）
  const bytes = randomBytes(length)
  const result: string[] = []

  for (let i = 0; i < length; i++) {
    result.push(characters.charAt(bytes[i] % characters.length))
  }

  return result.join('')
}

/**
 * 生成唯一标识符（UUID）
 * @returns UUID 字符串
 */
export const uuid = (): string => {
  return Utils.getUUID()
}

/**
 * 生成格式化的序列号
 * @param groupSize - 每组字符数
 * @param numberOfGroups - 组数
 * @param prefix - 前缀（可选）
 * @returns 格式化序列号
 */
export const generateSerialNumber = (groupSize: number = 5, numberOfGroups: number = 4, prefix: string = 'SN'): string => {
  const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const totalLength = groupSize * numberOfGroups
  const randomPart: string[] = []

  for (let i = 0; i < totalLength; i++) {
    randomPart.push(possibleChars.charAt(Math.floor(Math.random() * possibleChars.length)))
  }

  const groups: string[] = []
  for (let i = 0; i < randomPart.length; i += groupSize) {
    groups.push(randomPart.slice(i, i + groupSize).join(''))
  }

  return prefix ? `${prefix}-${groups.join('-')}` : groups.join('-')
}

/**
 * 去左右空格
 * @param value - 需要处理的字符串
 * @returns 去除空格后的字符串
 */
export const trim = (value: string): string => {
  if (typeof value !== 'string') return value
  return value.replace(/(^\s*)|(\s*$)/g, '')
}

/**
 * 去所有空格
 * @param value - 需要处理的字符串
 * @returns 去除所有空格的字符串
 */
export const trimAll = (value: string): string => {
  if (typeof value !== 'string') return value
  return value.replace(/\s+/g, '')
}

/**
 * 替换所有相同字符串
 * @param text - 需要处理的字符串
 * @param search - 被替换的字符串
 * @param replacement - 替换后的字符串
 * @returns 替换后的字符串
 */
export const replaceAll = (text: string, search: string, replacement: string): string => {
  if (typeof text !== 'string' || typeof search !== 'string' || typeof replacement !== 'string') {
    return text
  }
  return text.replace(new RegExp(search, 'gm'), replacement)
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
 * 将对象的所有键从 camelCase 转为 snake_case
 * @param obj - 源对象
 * @returns 键已转换的新对象
 */
export const camelToSnakeKeys = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value
  }
  return result
}

/**
 * 将对象数组的所有键从 camelCase 转为 snake_case
 * @param arr - 源对象数组
 * @returns 键已转换的新数组
 */
export const camelToSnakeKeysArr = <T extends Record<string, unknown>>(arr: T[]): Record<string, unknown>[] => {
  return arr.map((item) => camelToSnakeKeys(item))
}

/**
 * 首字母大写
 * @param str - 需要处理的字符串
 * @returns 首字母大写的字符串
 */
export const capitalize = (str: string): string => {
  if (!str || str.length === 0) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * 手机号脱敏
 * @param mobile - 手机号码
 * @returns 脱敏后的手机号
 */
export const maskMobile = (mobile: string | number): string | number => {
  if (typeof mobile !== 'string' && typeof mobile !== 'number') return mobile
  const strMobile = mobile.toString()
  return strMobile.length === 11 ? strMobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : strMobile
}

/**
 * 邮箱脱敏
 * @param email - 邮箱地址
 * @returns 脱敏后的邮箱
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email
  const [username, domain] = email.split('@')
  if (username.length <= 2) return email

  const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1)
  return `${maskedUsername}@${domain}`
}
