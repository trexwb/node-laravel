/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: ${git_name}
 * @LastEditTime: 2026-07-13 10:35:00
 * @FilePath: /stl-dev-server/server/src/app/Http/Middleware/VerifySignature.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import { CryptoTool } from '#utils/cryptoTool'
import type { NextFunction, Request, Response } from 'express'

function sortObjectDeep(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectDeep)
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortObjectDeep(v)])
    )
  } else {
    return obj
  }
}

/**
 * 获取签名密钥。
 * 优先使用已鉴权 secretRow 的 appSecret；缺失时回退全局 app_key（S6：显式告警，避免静默降级导致密钥不一致）。
 */
function getSigningKey(req: Request): string {
  if (req.secretRow?.appSecret) {
    return req.secretRow.appSecret
  }
  console.warn('[VerifySignature] secretRow missing, falling back to global app_key')
  const fallbackKey: unknown = config('app.security.app_key')
  return fallbackKey as string
}

export const verifySignature = (req: Request, res: Response, next: NextFunction) => {
  const isEnabled = config('app.security.verify_signature')
  if (!isEnabled) return next()

  // 1. 提取业务参数 (Query + Body)
  const rawParams = { ...req.query, ...req.body }

  if (Object.keys(rawParams).length === 0) return next()

  // 2. 定义需要跳过签名的字段名单
  // P2 收紧：仅豁免文件二进制与明确的富文本编辑器大字段（JSON 序列化开销过大）。
  // content 字段已纳入签名——它可能承载业务关键数据（商品描述、公告等），不可被中间人静默篡改。
  // 富文本字段的注入风险应通过服务端 XSS 过滤/白名单校验兜底，而非依赖签名豁免。
  const skipFields = [
    'file',
    'files',
    'filename',
    'buffer',
    'editorData', // 富文本编辑器大字段
    'html', // 富文本编辑器大字段
    'richText', // 富文本编辑器大字段
  ]

  // 3. 过滤掉不需要签名的字段
  const params = Object.keys(rawParams).reduce(
    (acc, key) => {
      if (!skipFields.includes(key)) {
        acc[key] = rawParams[key]
      }
      return acc
    },
    {} as Record<string, unknown>
  )

  // 4. 空参数处理：strict 模式下强制验签，非 strict 模式保持兼容
  const strictMode = config('app.security.strict_signature') ?? false
  if (Object.keys(params).length === 0) {
    if (!strictMode) {
      return next()
    }
    // strict 模式：即使业务参数为空，也必须携带 x-sign
    const signEmpty = req.headers['x-sign'] as string
    if (!signEmpty) {
      return res.error(403019011001, 'Signature missing')
    }
    const appKeyEmpty = getSigningKey(req)
    // 升级为 HMAC-SHA256（与主签名路径一致，审计 2026-08-18）
    const serverSignEmpty = CryptoTool.hmacSha256(CryptoTool.sha256(JSON.stringify({})), appKeyEmpty)
    if (signEmpty !== serverSignEmpty) {
      if (config('app.security.legacy_xsign_md5')) {
        const legacyEmpty = CryptoTool.md5(CryptoTool.sha256(JSON.stringify({})) + appKeyEmpty)
        if (signEmpty === legacyEmpty) return next()
      }
      return res.error(403019011002, 'Invalid signature')
    }
    return next()
  }

  // 5. 从 Headers 获取签名
  const sign = req.headers['x-sign'] as string
  if (!sign) {
    return res.error(403019011003, 'Signature missing')
  }

  // 6. 签名算法（升级，审计 2026-08-18）：参数排序 -> JSON -> SHA256 -> HMAC-SHA256(key)
  // 旧算法 md5(sha256(params)+key) 默认拒绝，仅 LEGACY_XSIGN_MD5=true 时过渡兼容
  const appKey = getSigningKey(req)
  const sortedParams = sortObjectDeep(params)
  const paramsDigest = CryptoTool.sha256(JSON.stringify(sortedParams))
  const serverSign = CryptoTool.hmacSha256(paramsDigest, appKey)

  if (sign !== serverSign) {
    if (config('app.security.legacy_xsign_md5')) {
      const legacySign = CryptoTool.md5(paramsDigest + appKey)
      if (sign === legacySign) {
        console.warn('[VerifySignature] Legacy x-sign algorithm used, please upgrade client to HMAC-SHA256')
        return next()
      }
    }
    return res.error(403019011004, 'Invalid signature')
  }

  next()
}
