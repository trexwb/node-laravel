/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: ${git_name}
 * @LastEditTime: 2026-04-02 09:40:09
 * @FilePath: /stl-dev-server/server/src/app/Http/Middleware/RefreshToken.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import crypto from 'node:crypto'
import { config } from '#bootstrap/configLoader'
import { CacheService } from '#app/Services/Cache/CacheService'
import { CryptoTool } from '#utils/cryptoTool'
import type { NextFunction, Request, Response } from 'express'

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  const tokenTime = config('app.security.token_time')
  // 1. 从请求中获取当前的 User 对象（假设前面的 Authenticate 中间件已解析并注入）
  const currentUser = req.currentUser
  const currentTokenPayload = req.tokenPayload // 假设解析 Token 时把原始 payload 存了进来
  // 预判是否需要续期：剩余有效期不足总时长的 1/2
  let shouldRefresh = false
  if (currentUser && currentTokenPayload && currentTokenPayload.timeStamp) {
    const now = Math.floor(Date.now() / 1000)
    const timeLeft = currentTokenPayload.timeStamp - now
    if (timeLeft > 0 && timeLeft < tokenTime / 2) {
      shouldRefresh = true
      // P2 修复：续期前将旧 token 立即加入黑名单（TTL = 剩余有效期），防止续期后旧 token 长期有效
      const oldJti = currentTokenPayload.jti
      if (typeof oldJti === 'string' && oldJti.length > 0) {
        try {
          await CacheService.set(`token:blacklist:${oldJti}`, '1', Math.max(Math.floor(timeLeft), 1))
        } catch (cacheErr) {
          console.warn('[RefreshToken] Failed to revoke old token:', cacheErr)
        }
      }
    }
  }
  // 拦截响应
  const originalJson = res.json
  res.json = function (body): Response {
    if (shouldRefresh && currentUser && currentTokenPayload?.timeStamp) {
      const now = Math.floor(Date.now() / 1000)
      const newTokenData = {
        token: currentUser.rememberToken,
        timeStamp: now + tokenTime,
        jti: crypto.randomUUID(), // 轮换标识：每次续期生成新的唯一 ID
      }
      const newToken = CryptoTool.generateToken(JSON.stringify(newTokenData))
      // 3. 注入 Header
      if (newToken !== undefined && newToken !== null) {
        res.setHeader('X-New-Token', newToken)
        // 必须暴露 Header，否则前端 Axios 等库无法读取自定义 Header
        res.setHeader('Access-Control-Expose-Headers', 'X-New-Token')
      }
    }
    return originalJson.call(this, body)
  }
  next()
}
