/*
 * @Author: trexwb
 * @Date: 2026-08-13
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-13
 * @FilePath: /stl/server/src/app/Http/Middleware/ValidateRequest.ts
 * @Description:
 * 请求校验中间件工厂：将 BaseRequest 子类包装为 Express 中间件。
 * 校验通过后以 req.body = validated 透传，校验失败 next(error)。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { BaseRequest } from '#app/Http/Requests/BaseRequest'
import type { NextFunction, Request, Response } from 'express'

export function validateRequest(RequestClass: new (req: Request) => BaseRequest) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const instance = new RequestClass(req)
      const validated = await instance.validate()
      req.body = validated
      next()
    } catch (error) {
      next(error)
    }
  }
}
