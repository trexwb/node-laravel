/*
 * @Author: trexwb
 * @Date: 2026-01-29
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-02
 * @FilePath: node-laravel/src/app/Http/Middleware/Authorize.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { NextFunction, Request, Response } from 'express'

export const can = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const currentUser = req.currentUser
    if (!currentUser) {
      res.error(401019003001, 'Unauthorized: user not exist')
      return
    }
    const roles = currentUser.roles || []
    if (!roles || !roles.length) {
      res.error(401019003002, 'Unauthorized: roles not exist')
      return
    }
    const permissions: string[] = roles.flatMap((role) =>
      role.permissionDetails?.map((p) => `${p.key}:${p.operation}`) ?? []
    )
    if (!permissions || !permissions.length) {
      res.error(401019003003, 'Unauthorized: permission not exist')
      return
    }
    try {
      // 校验权限
      if (!permissions.includes(permissionName)) {
        res.error(403019003004, `Forbidden: Missing permission`)
        return
      }
      next()
    } catch (error) {
      next(error)
    }
  }
}
