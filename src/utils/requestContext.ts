/*
 * @Author: trexwb
 * @Date: 2026-04-08
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-08
 * @FilePath: /stl-dev-server/server/src/utils/RequestContext.ts
 * @Description:
 * 请求上下文（AsyncLocalStorage）
 * 在整个异步调用链中透明传递 traceId、pid 等轻量元数据，
 * 无需手动透传 req 对象。仅存储轻量字段，禁止存储 req/res 等大对象。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { AsyncLocalStorage } from 'node:async_hooks'
import type { RequestContextState } from '#types/utils'
export type { RequestContextState } from '#types/utils'

/**
 * 请求上下文数据（只存轻量字段，O(1) 内存）
 */

/**
 * 全局请求上下文存储（单例）
 * 在 TraceId 中间件中通过 requestContext.run(state, next) 绑定作用域。
 */
export const requestContext = new AsyncLocalStorage<RequestContextState>()

/**
 * 获取当前请求的 traceId，不在请求上下文中时返回 'N/A'
 */
export function getTraceId(): string {
  return requestContext.getStore()?.traceId ?? 'N/A'
}
