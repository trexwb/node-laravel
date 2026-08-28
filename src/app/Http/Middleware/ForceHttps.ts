/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-05 17:32:26
 * @FilePath: /stl/server/src/app/Http/Middleware/ForceHttps.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import type { NextFunction, Request, Response } from 'express'

export const forceHttps = (req: Request, res: Response, next: NextFunction) => {
  if (!req.secure) {
    // 使用配置的权威域名，而非可被注入的 Host 头
    const configuredHost = String(config('app.app_url') || '').replace(/^https?:\/\//, '')
    const host = configuredHost || req.headers.host
    return res.redirect(`https://${host}${req.url}`)
  }
  next()
}
