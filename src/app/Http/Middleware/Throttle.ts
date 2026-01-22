import { rateLimit } from 'express-rate-limit';
import { Request, Response } from 'express';

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

    // 自定义超出限制时的返回内容 (Laravel 风格)
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        message: 'Too Many Attempts.',
        retry_after: `${windowMinutes} minute(s)`
      });
    },

    // 区分客户端的 Key (如果有登录用户按用户ID限制，否则按IP)
    keyGenerator: (req: Request) => {
      return (req as any).user?.id || req.ip;
    }
  });
};