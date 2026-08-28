/**
 * 日志操作类型枚举（值 + 类型统一在此声明）
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

export const logHandle = {
  SecretsUpdate: 'secrets_modify',
  ServerUpdate: 'servers_modify',
  SchedulesTaskRunner: 'schedules_taskRunner',
  OrdersUpdate: 'orders_modify',
  OrderRefundsUpdate: 'orders_refunds_modify',
  authorizeSign: 'authorize_sign',
  authorizeSignOut: 'authorize_sign_out',
} as const

export type logHandle = (typeof logHandle)[keyof typeof logHandle]
