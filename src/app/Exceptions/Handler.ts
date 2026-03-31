/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:49:55
 * @FilePath: /node-laravel/src/app/Exceptions/Handler.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Request, Response, NextFunction } from 'express';
import { isDebug } from '#bootstrap/configLoader';
import { logger } from '#utils/Logger';

// ============================================================
// 全局异常处理器
// Express 路由未匹配或 next(error) 时触发
// ============================================================

interface AppError extends Error {
  status?: number;
  code?: string | number;
  isOperational?: boolean; // 是否为预期内业务错误（非系统崩溃）
}

export class Handler {
  /**
   * 全局错误处理中间件（必须放在所有路由之后）
   */
  public static render(
    err: AppError,
    req: Request,
    res: Response,
    _next: NextFunction
  ) {
    const status = err.status || 500;
    const code = err.code || status;
    const isOperational = err.isOperational ?? false;

    // 🔍 提取请求ID（用于关联日志）
    const requestId = (req as any).id || 'unknown';

    // 📝 结构化日志
    if (status >= 500) {
      logger.error(`[Error] req=${requestId} code=${code} msg="${err.message}" path=${req.path}`, {
        status,
        isOperational,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
      });
    } else if (status >= 400) {
      logger.warn(`[Warn]  req=${requestId} code=${code} msg="${err.message}" path=${req.path}`, {
        status,
        isOperational,
      });
    }

    // 生产环境不泄露内部错误细节（但保留业务错误信息）
    const responseBody: Record<string, any> = {
      code,
      msg: isDebug() ? err.message : (isOperational ? err.message : 'Internal Server Error'),
    };

    // 仅开发环境显示堆栈
    if (isDebug() && err.stack) {
      responseBody.stack = err.stack.split('\n').slice(0, 5); // 限制堆栈行数
      responseBody.requestId = requestId;
    }

    res.status(status).json(responseBody);
  }

  // ============================================================
  // 快捷工具：创建业务错误（用于 throw new AppError()）
  // ============================================================
  public static badRequest(code: string | number, message: string): AppError {
    const err = new Error(message) as AppError;
    err.status = 400;
    err.code = code;
    err.isOperational = true;
    return err;
  }

  public static unauthorized(code: string | number, message: string = 'Unauthorized'): AppError {
    const err = new Error(message) as AppError;
    err.status = 401;
    err.code = code;
    err.isOperational = true;
    return err;
  }

  public static forbidden(code: string | number, message: string = 'Forbidden'): AppError {
    const err = new Error(message) as AppError;
    err.status = 403;
    err.code = code;
    err.isOperational = true;
    return err;
  }

  public static notFound(code: string | number, message: string = 'Not Found'): AppError {
    const err = new Error(message) as AppError;
    err.status = 404;
    err.code = code;
    err.isOperational = true;
    return err;
  }

  public static internal(message: string = 'Internal Server Error'): AppError {
    const err = new Error(message) as AppError;
    err.status = 500;
    err.code = 500000000000;
    err.isOperational = false;
    return err;
  }
}
