import type { Request, Response, NextFunction } from 'express';


declare module 'express-serve-static-core' {
  interface Response {
    success: (data?: any, code?: string) => Response;
    error: (code?: string | number, msg?: string) => Response;
  }
}

export const responseWrapper = (_req: Request, res: Response, next: NextFunction) => {
  // 成功响应的快捷方法
  res.success = function (data: any = null, code: string = 'success') {
    return res.status(200).json({
      code,
      msg: 'success',
      data
    });
  };

  // 失败响应的快捷方法
  res.error = function (code: string | number = 400, msg: string = 'fail') {
    return res.status(Number((code || 400).toString().substring(0, 3) || 400)).json({
      code,
      msg: msg || 'fail',
    });
  };

  next();
};