/*
 * @Author: trexwb
 * @Date: 2026-03-30
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/app/Listeners/System/WriteLogsListener.ts
 * @Description:
 * 系统日志监听器 - 统一记录各类操作日志
 * 框架版：不依赖任何业务 LogsModel，落库目标由业务方通过 Container 注册 LogSinkRegistry 注入
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { WriteLogsPayload } from '#app/Events/System/WriteLogs'
import { WriteLogs } from '#app/Events/System/WriteLogs'
import { Container } from '#app/Foundation/Container'
import { eventBus } from '#bootstrap/events'
import type { LogSinkRegistry } from '#types/framework'
import * as _ from 'lodash-es'

const clone = <T>(data: T): T => (structuredClone ? structuredClone(data) : _.cloneDeep(data))

/** 日志表中禁止存储的敏感字段（统一在此维护） */
const SENSITIVE_FIELDS = new Set([
  'password',
  'salt',
  'secret',
  'rememberToken',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'privateKey',
  'appSecret',
  'appIv',
])

/**
 * 从 source 对象中移除敏感字段，防止密码/密钥等写入日志表。
 * 采用深度克隆 + 选择性过滤，避免修改原始对象引用。
 */
function sanitizeSourceForLog(source: Record<string, unknown>): Record<string, unknown> {
  const cloned = clone(source)
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(cloned)) {
    if (SENSITIVE_FIELDS.has(key)) continue
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeSourceForLog(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }
  return result
}

export class WriteLogsListener {
  private static _listening = false

  static listen(): void {
    if (this._listening) return
    this._listening = true
    // 同时监听 WriteLogs.eventName（兼容 WriteLogs.emit 调用）
    eventBus.on(WriteLogs.eventName, (payload: WriteLogsPayload) => {
      this.handle(payload).catch((err) => {
        console.error('[WriteLogsListener] handle error:', err)
      })
    })
  }

  private static async handle(payload: WriteLogsPayload): Promise<void> {
    const { source, handle, action } = payload
    // 业务方通过 Container 注册 logs.sinkRegistry，按 action 返回对应落库器
    const registry = Container.resolve<LogSinkRegistry>('logs.sinkRegistry', () => () => undefined)
    const sink = registry(action)
    if (!sink) return
    await sink.insert({
      source: sanitizeSourceForLog(source as Record<string, unknown>),
      handle: { ...sanitizeSourceForLog(handle as Record<string, unknown>), action },
    })
  }
}
