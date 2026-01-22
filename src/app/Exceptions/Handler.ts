import { Request, Response, NextFunction } from 'express';

export class Handler {
  public static render(err: any, _req: Request, res: Response, _next: NextFunction) {
    const status = err.status || 500;
    res.status(status).json({
      error: {
        msg: err.message || 'Internal Server Error',
        code: err.code || 'UNKNOWN_ERROR',
        data: process.env.APP_DEBUG === 'true' ? { stack: err.stack } : null,
        // 仅在本地环境显示堆栈信息
        stack: process.env.APP_ENV === 'development' ? err.stack : undefined
      }
    });
  }
}