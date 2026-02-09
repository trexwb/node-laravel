/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:50:33
 * @FilePath: /node-laravel/src/app/Exceptions/Handler.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Request, Response, NextFunction } from 'express';
import { config } from '#bootstrap/configLoader';

export class Handler {
  public static render(err: any, _req: Request, res: Response, _next: NextFunction) {
    const status = err.status || 500;
    res.status(status).json({
      msg: err.message || 'Internal Server Error',
      code: err.code || 'UNKNOWN_ERROR',
      // 仅在开发环境显示堆栈信息
      stack: config('app.debugger') === 'true' ? err.stack : undefined
    });
  }
}