/*
 * @Author: trexwb
 * @Date: 2026-07-23
 * @Description: 通用脱敏工具函数
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

/**
 * 手机号脱敏: 13800138000 → 138****8000
 * 非手机号（长度≠11 或包含非数字）原样返回
 */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const s = String(phone).trim()
  if (!/^\d{11}$/.test(s)) return s
  return s.substring(0, 3) + '****' + s.substring(7)
}
