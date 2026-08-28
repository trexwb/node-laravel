/*
 * @Author: trexwb
 * @Date: 2026-01-29
 * @LastEditors: trexwb
 * @LastEditTime: 2026-07-09
 * @FilePath: node-laravel/src/bootstrap/env.ts
 * @Description: 环境变量统一加载与读取
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 加载 .env 文件
dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
})

/**
 * 获取环境变量值
 * @param key 环境变量名
 * @param defaultValue 默认值
 * @returns 环境变量值或默认值
 */
export function env(key: string, defaultValue?: string | number | boolean): string | number | boolean | undefined {
  const value = process.env[key]

  if (value === undefined || value === '') {
    return defaultValue
  }

  // 布尔值转换
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false

  // 数字转换（纯数字字符串）
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10)
  }

  // 浮点数转换
  if (/^\d+\.\d+$/.test(value)) {
    return parseFloat(value)
  }

  return value
}

/**
 * 获取字符串类型环境变量
 */
export function envString(key: string, defaultValue: string = ''): string {
  const value = env(key, defaultValue)
  return String(value ?? defaultValue)
}

/**
 * 获取数字类型环境变量
 */
export function envNumber(key: string, defaultValue: number = 0): number {
  const value = env(key, defaultValue)
  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

/**
 * 获取布尔类型环境变量
 */
export function envBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = env(key, defaultValue)
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true'
  }
  return defaultValue
}

// 导出已加载标记（用于判断环境变量是否已初始化）
export const envLoaded = true

export {}
