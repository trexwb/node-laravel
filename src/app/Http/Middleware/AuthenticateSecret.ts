/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/app/Http/Middleware/AuthenticateSecret.ts
 * @Description:
 * 应用密钥鉴权中间件（纯框架版）
 * 业务方需通过 Container 注册密钥提供者（注入键：auth.secretProvider）。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { Container } from '#app/Foundation/Container'
import { CacheService } from '#app/Services/Cache/CacheService'
import { config } from '#bootstrap/configLoader'
import type { SecretProvider } from '#types/framework'
import { CryptoTool } from '#app/Helpers/cryptoTool'
import type { NextFunction, Request, Response } from 'express'

export const authenticateSecret = async (req: Request, res: Response, next: NextFunction) => {
  // 0. 校验密钥提供者已注册（未注册则明确报错，避免静默放行/静默拒绝）
  if (!Container.has('auth.secretProvider')) {
    return res.error(500000100001, 'AuthenticateSecret: auth.secretProvider not registered')
  }
  const secretProvider = Container.resolve<SecretProvider>('auth.secretProvider')

  // 1. 获取 Headers
  const appId = req.headers['app-id'] as string
  const appSecret = req.headers['app-secret'] as string // 这里实际传的是签名后的密文
  if (!appId || !appSecret) {
    return res.error(401000100001, 'appId/appSecret is empty')
  }
  // 2. 提取时间戳（密文末尾固定 10 位；兼容旧 md5(32hex) 与新版 hmac(64hex) 两种前缀长度）
  const timeStampStr = appSecret.substring(appSecret.length - 10)
  const timeStamp = parseInt(timeStampStr) || 0
  const tokenTime = parseInt(config('app.security.token_time') || '1800')
  // 允许客户端/服务端存在少量时钟偏差（秒）
  const maxFutureSkew = parseInt(config('app.security.max_future_skew', 300) || '300')
  // 3. 校验时间戳是否过期
  const now = Math.floor(Date.now() / 1000)
  if (timeStamp > now + maxFutureSkew) {
    return res.error(401000100002, 'appSecret timestamp is in the future')
  }
  if (timeStamp < now - tokenTime) {
    return res.error(401000100003, 'appSecret expiration')
  }
  // 4. 从注入的提供者获取原始 Secret
  const secretRow = await secretProvider(Number(appId))
  if (!secretRow || !secretRow.appId || !secretRow.appSecret) {
    return res.error(401000100004, 'appId/appSecret error')
  }
  if (!secretRow.status) {
    return res.error(403000100001, 'appSecret has been disabled')
  }
  // P2 修复：升级为 HMAC-SHA256 签名算法，兼容旧 md5 算法过渡
  // 旧算法存在静态密钥 + 时间窗重放风险，新算法为 HMAC-SHA256(appId+ts, appSecret)
  const appStr = `${secretRow.appId}${timeStampStr}`
  const expectedSecret = CryptoTool.hmacSha256(appStr, secretRow.appSecret) + timeStampStr
  if (appSecret !== expectedSecret) {
    // 旧 MD5 算法默认拒绝；仅在 LEGACY_MD5_SIGNATURE=true 时过渡兼容
    if (!config('app.security.legacy_md5_signature')) {
      return res.error(401000100005, 'appSecret verification failed')
    }
    const legacyAppStr = CryptoTool.sha256(`${secretRow.appId}${timeStampStr}`)
    const legacyExpectedSecret = CryptoTool.md5(`${legacyAppStr}${secretRow.appSecret}`) + timeStampStr
    if (appSecret !== legacyExpectedSecret) {
      return res.error(401000100005, 'appSecret verification failed')
    }
    console.warn('[AuthenticateSecret] Legacy signature algorithm used, please upgrade client to HMAC-SHA256')
  }
  // P2 加固：nonce 防重放（客户端携带 X-Nonce 时启用；REQUIRE_NONCE=true 时强制）
  const nonce = req.headers['x-nonce'] as string | undefined
  if (nonce && nonce.length > 0 && nonce.length <= 128) {
    const nonceKey = `secret:nonce:${appId}:${nonce}`
    const used = await CacheService.get(nonceKey)
    if (used) {
      return res.error(401000100006, 'appSecret nonce already used')
    }
    await CacheService.set(nonceKey, '1', tokenTime)
  } else {
    if (config('app.security.require_nonce')) {
      return res.error(401000100007, 'appSecret nonce required')
    }
    // 缺失 nonce 时在生产环境告警，推动客户端尽快启用
    if (config('app.env') === 'production') {
      console.warn('[AuthenticateSecret] Request without X-Nonce in production — replay protection degraded')
    }
  }
  // 6. 鉴权通过，挂载数据供后续使用
  req.secretRow = secretRow
  return next()
}
