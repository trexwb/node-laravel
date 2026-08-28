/**
 * 首页统计类型枚举（值 + 类型统一在此声明）
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

/** 统计类型 */
export const STAT_TYPE = {
  ORDERS: 'orders',
  REFUNDS: 'refunds',
  INVOICES: 'invoices',
  USERS: 'users',
} as const

export type StatType = (typeof STAT_TYPE)[keyof typeof STAT_TYPE]
