/*
 * @Author: trexwb
 * @Date: 2026-04-08
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-08
 * @FilePath: /stl-dev-server/server/src/app/Http/Middleware/TraceId.ts
 * @Description:
 * TraceId 中间件 — 请求唯一追踪标识
 *
 * 职责：
 *   1. 读取客户端传入的 x-trace-id header（上游服务/网关串联）
 *   2. 未传入时自动生成 UUID v4
 *   3. 将 traceId 写入响应头 x-trace-id（便于客户端/网关记录）
 *   4. 通过 AsyncLocalStorage 绑定上下文，整个请求链路均可 getTraceId() 读取
 *
 * 注册位置：bootstrap/app.ts，responseWrapper 之前
 *
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { requestContext } from '#utils/requestContext'
import type { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'node:crypto'

/**
 * TraceId 中间件
 *
 * 使用方式：
 *   app.use(traceIdMiddleware);     // 在 responseWrapper 之前注册
 */
export function traceIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 优先使用客户端/网关传入的 trace ID，否则自动生成
  const traceId = (req.headers['x-trace-id'] as string | undefined) || randomUUID()

  // 回写到响应头，让客户端/网关可以记录
  res.setHeader('x-trace-id', traceId)

  // 将上下文状态绑定到整个 async 调用链
  requestContext.run(
    {
      traceId,
      pid: process.pid,
      path: req.path,
      method: req.method,
    },
    next
  )
}
