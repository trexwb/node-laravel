/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/app/Http/Middleware/Throttle.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

/**
 * 节流中间件工厂
 * @param max 请求次数限制
 * @param windowMinutes 时间窗口（分钟）
 * @param keyGenerator 可选，自定义限流 Key 生成器（默认按 IP）
 */
export const throttle = (
  max: number = 60,
  windowMinutes: number = 1,
  keyGenerator?: (req: Request) => string
) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    // ✅ 按请求ID限流（更精准，避免多人共用IP时误伤）
    keyGenerator: keyGenerator || ((req: Request) => {
      // 优先用请求ID，其次用认证用户的ID，最后用IP
      return req.id || req.currentUser?.id?.toString() || req.ip || 'unknown';
    }),
    validate: { trustProxy: true },
    // 自定义超出限制时的返回内容
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        code: 429001000,
        msg: 'Too Many Attempts.',
        retry_after: `${windowMinutes} minute(s)`,
      });
    },
    // 超出限制后不立即拒绝，而是等滑动窗口过期
    skip: () => false,
  });
};
