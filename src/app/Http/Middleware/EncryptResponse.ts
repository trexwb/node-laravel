/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: ${git_name}
 * @LastEditTime: 2026-04-01 21:28:57
 * @FilePath: /stl-dev-server/server/src/app/Http/Middleware/EncryptResponse.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import { CryptoTool } from '#utils/cryptoTool'
import type { NextFunction, Request, Response } from 'express'
import * as _ from 'lodash-es'

const SENSITIVE_PATHS = new Set([
  'password',
  'salt',
  'secret',
  'rememberToken',
  'appSecret',
  'appIv',
  'token',
  'accessToken',
  'refreshToken',
  'privateKey',
  'apiKey',
  // configs 表 OSS 配置含 accessKeySecret（云资源凭证），必须裁剪
  'accessKeySecret',
  'accessKeyId',
])

// 递归裁剪敏感字段：顶层与嵌套对象均生效（修复仅顶层 _.unset 导致 data.user.password 等泄漏）
const omitByPath = <T>(obj: T): T => {
  if (Array.isArray(obj)) return obj.map((v) => omitByPath(v)) as unknown as T
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_PATHS.has(key)) continue
      out[key] = omitByPath(value)
    }
    return out as T
  }
  return obj
}

export const shapeData = (rawData: unknown, requestedFields?: string[]) => {
  if (!rawData || typeof rawData !== 'object') return rawData
  const pickIfNeeded = (item: unknown) => {
    const cleaned = omitByPath(item as object)
    return requestedFields?.length ? _.pick(cleaned, requestedFields) : cleaned
  }
  // 列表
  if (Array.isArray(rawData)) {
    return rawData.map(pickIfNeeded)
  }
  // Laravel 分页格式
  if (Array.isArray((rawData as Record<string, unknown>).data)) {
    const paginated = rawData as Record<string, unknown> & { data: unknown[] }
    return {
      ...paginated,
      data: paginated.data.map(pickIfNeeded),
    }
  }
  // 单条数据
  return pickIfNeeded(rawData)
}

export const encryptResponse = (req: Request, res: Response, next: NextFunction) => {
  const encryptEnabled = config('app.security.return_encrypt')
  const fieldsParam = req.query.fields as string | undefined
  const requestedFields = fieldsParam
    ?.split(',')
    .map((f) => f.trim())
    .filter(Boolean)
  const originalJson = res.json
  res.json = function (payload: unknown): Response {
    if (!payload || typeof payload !== 'object') {
      return originalJson.call(this, payload)
    }
    const p = payload as Record<string, unknown>
    if (!p.data) {
      return originalJson.call(this, payload)
    }
    const sourceData = p.data ?? payload
    // 1️⃣ 数据裁剪（永远执行）
    const shapedData = shapeData(sourceData, requestedFields)
    // 2️⃣ 不加密：直接返回
    if (!encryptEnabled) {
      p.data = shapedData
      return originalJson.call(this, payload)
    }
    // 3️⃣ 加密
    const appKey = req.secretRow?.appSecret || config('app.security.app_key')
    const appIv = req.secretRow?.appIv || config('app.security.app_iv')
    p.encryptedData = CryptoTool.encrypt(JSON.stringify(shapedData), appKey, appIv)
    delete p.data
    return originalJson.call(this, payload)
  }
  next()
}
