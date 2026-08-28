/*
 * @Author: trexwb
 * @Date: 2026-01-29
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-05
 * @FilePath: node-laravel/src/app/Http/Middleware/Throttle.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { Request, Response } from 'express'
import rateLimit from 'express-rate-limit'

/**
 * 节流中间件工厂
 * @param max 请求次数限制
 * @param windowMinutes 时间窗口（分钟）
 */
export const throttle = (max: number = 60, windowMinutes: number = 1) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000, // 转换成毫秒
    max: max, // 限制次数
    standardHeaders: true, // 在响应头中返回 RateLimit-* 信息
    legacyHeaders: false, // 禁用 X-RateLimit-* 旧版头
    validate: { trustProxy: false },
    // 自定义超出限制时的返回内容 (Laravel 风格)
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        message: 'Too Many Attempts.',
        retry_after: `${windowMinutes} minute(s)`,
      })
    },
  })
}
