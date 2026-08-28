/**
 * 工具层类型声明 — utils 目录与纯技术工具共用。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

/** RGB 颜色对象接口 */
export interface RGBColor {
  r: number
  g: number
  b: number
}

/** 日期时间段对象接口 */
export interface DateTimeSlot {
  start: Date
  end: Date
}

/** 请求上下文数据（只存轻量字段，O(1) 内存） */
export interface RequestContextState {
  /** 唯一请求追踪 ID（来自 x-trace-id header 或自动生成 UUID） */
  traceId: string
  /** 当前进程 PID */
  pid: number
  /** HTTP 请求路径（可选） */
  path?: string
  /** HTTP 方法（可选） */
  method?: string
}

/** 解密后的 Token 负载（与 src/types/express/index.d.ts 的 TokenPayload 结构一致） */
export interface TokenPayload {
  token: string
  timeStamp: number
  [key: string]: unknown
}
