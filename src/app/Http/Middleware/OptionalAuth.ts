/*
 * @Author: trexwb
 * @Date: 2026-08-13
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-13
 * @FilePath: /stl/server/src/app/Http/Middleware/OptionalAuth.ts
 * @Description:
 * 可选登录态中间件：请求头携带 Bearer token 时执行 authenticateToken，否则放行。
 * 适用场景：同一接口既支持游客访问（如登录二维码）也支持登录态访问（如绑定二维码）。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { authenticateToken } from '#app/Http/Middleware/AuthenticateToken'
import type { NextFunction, Request, Response } from 'express'

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers?.authorization
  if (!authHeader || !String(authHeader).startsWith('Bearer ')) {
    next()
    return
  }
  return authenticateToken(req, res, next)
}
