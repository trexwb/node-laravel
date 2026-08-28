/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/app/Http/Middleware/AuthenticateToken.ts
 * @Description:
 * 用户令牌鉴权中间件（纯框架版）
 * 业务方需通过 Container 注册令牌用户提供者（注入键：auth.tokenUserProvider）。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { Container } from '#app/Foundation/Container'
import { CacheService } from '#app/Services/Cache/CacheService'
import type { AuthUser } from '#types/express'
import type { TokenUserProvider } from '#types/framework'
import { CryptoTool } from '#utils/cryptoTool'
import type { NextFunction, Request, Response } from 'express'

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.error(401000200001, 'Unauthorized: Missing Token')
    return
  }
  const token = authHeader.split(' ')[1]
  try {
    // 1. 解密获取原始 Payload (包含 token 和 timeStamp)
    const decryptedResult = CryptoTool.decryptToken(token)
    // 2. 基础合法性校验
    if (!decryptedResult || !decryptedResult.token || !decryptedResult.timeStamp) {
      res.error(401000200002, 'Unauthorized: Invalid Token Structure')
      return
    }
    // 3. 类型安全检查
    if (typeof decryptedResult.timeStamp !== 'number') {
      res.error(401000200003, 'Unauthorized: Invalid Timestamp')
      return
    }
    // 4. 过期校验 (强制拦截)
    const now = Math.floor(Date.now() / 1000)
    if (now > decryptedResult.timeStamp) {
      res.error(401000200004, 'Unauthorized: Token Expired')
      return
    }
    // P2 修复：token 轮换黑名单校验（续期后旧 token 立即失效）
    // 兼容存量 token（无 jti 字段）不做黑名单检查
    if (typeof decryptedResult.jti === 'string' && decryptedResult.jti.length > 0) {
      const revoked = await CacheService.get(`token:blacklist:${decryptedResult.jti}`)
      if (revoked) {
        res.error(401000200007, 'Unauthorized: Token Revoked')
        return
      }
    }
    // 5. 从注入的提供者查询用户
    if (!Container.has('auth.tokenUserProvider')) {
      res.error(500000100001, 'AuthenticateToken: auth.tokenUserProvider not registered')
      return
    }
    const userProvider = Container.resolve<TokenUserProvider>('auth.tokenUserProvider')
    const userRow: AuthUser | null | undefined = await userProvider(decryptedResult.token)
    if (!userRow) {
      res.error(401000200005, 'Unauthorized: Invalid Token')
      return
    }
    if (userRow.status === 0) {
      res.error(400000200006, 'User is disabled')
      return
    }
    // 6. 将解析后的信息挂载到 req 对象（类型安全，见 src/types/express.d.ts）
    req.currentUser = userRow
    req.tokenPayload = decryptedResult
    next()
  } catch (error) {
    next(error)
  }
}
