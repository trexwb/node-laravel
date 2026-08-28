/**
 * 事件域类型声明 — 框架级事件 payload 统一收敛于此。
 * 业务事件及其 payload 由业务方在自身模块内扩展声明，不进入框架层。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

// ─── 系统模块 ────────────────────────────────────────────────────────

/** 系统日志事件 payload（action 为业务自定义操作标识，由 LogSinkRegistry 按 action 路由） */
export interface WriteLogsPayload {
  source: { id: number; [key: string]: unknown }
  handle: Record<string, unknown>
  action: string
}

/** 调度变更事件 payload */
export interface ScheduleChangedPayload {
  /** 变更原因，如 create / modifyById / deleteById / restoreByFilters */
  reason: string
  changedAt: Date
}

/** 缓存失效事件 payload */
export interface CacheInvalidatedPayload {
  cacheKey: string
  pattern?: string
  reason?: string
  invalidatedBy?: number
  invalidatedAt: Date
}

/** 缓存失效监听器形状（历史漂移：module/pattern/triggeredBy 与事件版本不同） */
export interface CacheInvalidatedListenerPayload {
  module: string // 模块名，如 'goods'、'users'
  pattern: string // 失效的缓存 key pattern
  triggeredBy?: string // 触发来源（方法名）
  invalidatedAt: Date
}
