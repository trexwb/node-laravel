import { config } from '#bootstrap/configLoader';

// 修改这一行：添加 type 关键字
import type { Request, Response, NextFunction } from 'express';

export class Handler {
  public static render(err: any, _req: Request, res: Response, _next: NextFunction) {
    const status = err.status || 500;

    res.status(status).json({
      error: {
        msg: err.message || 'Internal Server Error',
        code: err.code || 'UNKNOWN_ERROR',
        // 仅在开发环境显示堆栈信息
        stack: config('app.debugger') === 'true' ? err.stack : undefined
      }
    });
  }
}