/**
 * HTTP 层类型声明 — 异常处理、响应包装、请求体解析共用。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { Request } from 'express'

/** 错误消息映射条目（pattern → 业务码/http 状态码） */
export type MapEntry = { pattern: string; code: number; httpStatus: number }

/** 错误对象宽松形状 */
export interface AppErrorLike {
  message?: string
  stack?: string
  code?: string
  errorCode?: number
  statusCode?: number
}

/** 统一响应结构 */
export interface ApiResponse {
  code: string | number
  msg: unknown
  [key: string]: unknown // 允许其他属性
}

/** 携带原始请求体的 Request（raw-body 中间件注入） */
export type RawBodyRequest = Request & { rawBodyBuffer?: Buffer; _body?: boolean }
