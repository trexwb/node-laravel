/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/app/Http/Middleware/ResponseWrapper.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Request, Response, NextFunction } from 'express';

// ============================================================
// 响应包装器中间件
// 为 res 添加 success() / error() 快捷方法
// 响应格式：
//   成功：{ code: 200, msg: 'success', data: ... }
//   失败：{ code: <错误码>, msg: <错误信息> }
// ============================================================

// 从错误码中提取 HTTP 状态码
// 规则：错误码前3位数字即为 HTTP 状态码
// 例：401010002001 → 401，200001 → 200，500001 → 500
function extractHttpStatus(code: string | number): number {
  const codeStr = String(code);
  const match = /^(\d{3})/.exec(codeStr);
  return match ? parseInt(match[1]) : 200;
}

declare module 'express-serve-static-core' {
  interface Response {
    success(data?: any, code?: string | number): Response;
    error(code?: string | number, msg?: string): Response;
  }
}

export const responseWrapper = (_req: Request, res: Response, next: NextFunction) => {
  // ✅ 成功响应
  res.success = function (data: any = null, code: string | number = 200): Response {
    const httpStatus = extractHttpStatus(code);
    const payload = {
      code,
      msg: 'success',
      ...(data !== null && data !== undefined ? { data } : {}),
    };
    return res.status(httpStatus).json(payload);
  };

  // ❌ 错误响应
  res.error = function (code: string | number = 400, msg: string = 'fail'): Response {
    const httpStatus = extractHttpStatus(code);
    const payload = { code, msg };
    return res.status(httpStatus).json(payload);
  };

  next();
};
