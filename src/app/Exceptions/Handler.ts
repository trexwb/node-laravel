/*
 * @Author: trexwb
 * @Date: 2026-01-21
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/app/Exceptions/Handler.ts
 * @Description:
 * 全局异常处理器（纯框架版）——仅保留通用错误码映射，业务错误码由业务方自行扩展。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import type { AppErrorLike, MapEntry } from '#types/http'
import { createLogger } from '#app/Helpers/logger'
import type { NextFunction, Request, Response } from 'express'

const log = createLogger('Handler')

// ────────────────────────────────────────────────────────────────
// 错误码自动映射：err.message → numeric code
// 优先级：err.errorCode（service 预置）> message 关键词匹配 > service.action 映射 > 兜底
// ────────────────────────────────────────────────────────────────

const MESSAGE_CODE_MAP: MapEntry[] = [
  // 通用 404
  { pattern: 'not found', code: 400010000001, httpStatus: 404 },
  { pattern: '不存在', code: 400010000002, httpStatus: 404 },
  // 通用 403/401
  { pattern: 'Forbidden', code: 403000000001, httpStatus: 403 },
  { pattern: 'not belong', code: 403000000002, httpStatus: 403 },
  { pattern: '权限不足', code: 403000000003, httpStatus: 403 },
  { pattern: 'Unauthorized', code: 401000000001, httpStatus: 401 },
  // 通用参数校验
  { pattern: 'is required', code: 400010000010, httpStatus: 400 },
  { pattern: '不能为空', code: 400010000010, httpStatus: 400 },
  { pattern: 'Invalid', code: 400010000011, httpStatus: 400 },
  { pattern: '格式错误', code: 400010000011, httpStatus: 400 },
  { pattern: 'not a valid', code: 400010000011, httpStatus: 400 },
]

// 通用兜底（框架自身动作）
const KNOWN_SERVICE_ACTION: Record<string, { code: number; httpStatus: number }> = {
  'BaseModel.findById': { code: 404010000001, httpStatus: 404 },
  'BaseModel.transaction': { code: 500010000001, httpStatus: 500 },
}

/** 根据 err.message 关键词匹配 numeric 错误码 */
function matchByMessage(msg: string): MapEntry | undefined {
  const lower = msg.toLowerCase()
  return MESSAGE_CODE_MAP.find((e) => lower.includes(e.pattern.toLowerCase()))
}

/** 根据 err.code（wrapServiceError 设置的 "Service.method" 字符串）映射 numeric code */
function matchByServiceCode(code: string): { code: number; httpStatus: number } | undefined {
  const [svc, action] = code.split('.')
  const key = `${svc}.${action}`
  return KNOWN_SERVICE_ACTION[key]
}

/** 解析错误码：err.errorCode > message 关键词 > service.action > 兜底 */
function resolveErrorCode(err: AppErrorLike): { code: number; httpStatus: number } {
  // 1. service 层已预置 numeric errorCode → 直接用
  if (typeof err.errorCode === 'number') {
    return { code: err.errorCode, httpStatus: err.statusCode || 400 }
  }

  const msg = err.message ?? ''

  // 2. message 关键词匹配
  const entry = matchByMessage(msg)
  if (entry) return { code: entry.code, httpStatus: entry.httpStatus }

  // 3. wrapServiceError 设置的 err.code = "Service.method"（字符串）
  if (typeof err.code === 'string' && err.code.includes('.')) {
    const mapped = matchByServiceCode(err.code)
    if (mapped) return mapped

    // 兜底：已知 service.method 但未分配 code → 500
    log.warn({ err, code: err.code }, 'Handler: unhandled service.action, fallback 500010000001')
    return { code: 500010000001, httpStatus: 500 }
  }

  // 4. 完全未知错误
  return { code: 500010000001, httpStatus: 500 }
}

// ────────────────────────────────────────────────────────────────
// 全局异常处理器
// ────────────────────────────────────────────────────────────────
export class Handler {
  public static render(err: AppErrorLike, req: Request, res: Response, _next: NextFunction) {
    const { code, httpStatus } = resolveErrorCode(err)
    // 生产环境 5xx 不透传原始错误信息（避免带出 SQL/表结构线索），
    // 开发环境保留原始信息便于排查
    const msg =
      httpStatus >= 500 && config('app.env') === 'production' && !config('app.debugger')
        ? 'Internal Server Error'
        : err.message || 'Internal Server Error'

    // 5xx 服务端错误需要记录日志（4xx 客户端错误仅返回，不写日志）
    if (httpStatus >= 500) {
      const logData: Record<string, unknown> = {
        err,
        method: req.method,
        path: req.path,
        httpStatus,
        code,
      }

      // 加密解密错误记录更多上下文
      if (msg.includes('Encryption failed') || msg.includes('Invalid JSON format')) {
        logData.module = 'Middleware:Decrypt'
        logData.url = req.url
        logData.query = req.query
        logData.headers = {
          'content-type': req.headers['content-type'],
          'content-length': req.headers['content-length'],
          'user-agent': req.headers['user-agent'],
        }

        const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
        logData.body_preview = bodyStr.substring(0, 200) + (bodyStr.length > 200 ? '...' : '')

        if (config('app.debugger')) {
          logData.ip = req.ip
          logData.originalUrl = req.originalUrl
          if (typeof req.body?.encryptedData === 'string') {
            logData.encrypted_preview = req.body.encryptedData.substring(0, 100)
            logData.encrypted_length = req.body.encryptedData.length
          }
        }
      }

      log.error(logData, '服务端异常')
    }

    res.status(httpStatus).json({
      msg,
      code,
      stack: config('app.debugger') ? err.stack : undefined,
    })
  }
}
