/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:51:44
 * @FilePath: /node-laravel/src/app/Http/Middleware/ResponseWrapper.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Request, Response, NextFunction } from 'express';

// 定义响应数据结构
interface ApiResponse {
  code: string | number;
  msg: string;
  [key: string]: any; // 允许其他属性
}

declare module 'express-serve-static-core' {
  interface Response {
    success: (data?: any, code?: string) => Response;
    error: (code?: string | number, msg?: string) => Response;
  }
}

export const responseWrapper = (_req: Request, res: Response, next: NextFunction) => {
  // 成功响应的快捷方法
  res.success = function (data: any = null, code: string | number = 200) {
    const dataObj: ApiResponse = {
      code,
      msg: 'success'
    };
    if (data) dataObj.data = data;
    return res.status(Number((code || 400).toString().substring(0, 3) || 200)).json(dataObj);
  };
  // 失败响应的快捷方法
  res.error = function (code: string | number = 400, msg: string = 'fail') {
    const dataObj: ApiResponse = {
      code,
      msg
    };
    return res.status(Number((code || 400).toString().substring(0, 3) || 400)).json(dataObj);
  };
  next();
};