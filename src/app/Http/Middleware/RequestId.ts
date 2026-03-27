/**
 * @Author: trexwb
 * @Date: 2026-03-27 11:30:00
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/app/Http/Middleware/RequestId.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 * 
 * 请求ID中间件：为每个HTTP请求分配唯一ID，用于全链路追踪
 * 支持：
 *   1. 复用客户端传入的 X-Request-Id（存在则透传）
 *   2. 不存在则自动生成 UUID v4
 *   3. 在响应头中返回 X-Request-Id
 *   4. 将 ID 挂载到 req.id 供后续使用
 */
import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '#utils/Logger';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  // 优先使用客户端传入的 X-Request-Id，保持分布式追踪一致性
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();

  // 挂载到请求对象，供后续中间件/控制器/日志使用
  req.id = requestId;

  // 响应头透传，方便客户端排查
  res.setHeader('X-Request-Id', requestId);

  next();
};
