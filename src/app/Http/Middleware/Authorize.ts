/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/app/Http/Middleware/Authorize.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Request, Response, NextFunction } from 'express';
import { logger } from '#utils/Logger';

/**
 * 权限校验中间件工厂
 * @param permissionName 格式: "key:operation"，如 "users:create"
 * 
 * 使用示例：
 *   router.post('/users', authenticateToken, can('users:create'), UsersController.create)
 */
export const can = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const currentUser = req.currentUser;

    if (!currentUser) {
      res.error(401010003001, 'Unauthorized');
      return;
    }

    const roles = currentUser.roles || [];
    if (!roles || !roles.length) {
      res.error(401010003002, 'Unauthorized');
      return;
    }

    const permissions: string[] = roles.flatMap((role: { permissions?: Array<{ key: string; operation: string }> }) =>
      (role.permissions || []).map(p => `${p.key}:${p.operation}`)
    );

    if (!permissions.length) {
      res.error(401010003003, 'Unauthorized');
      return;
    }

    try {
      if (!permissions.includes(permissionName)) {
        logger.warn(`[Auth] User ${currentUser.id} 权限不足: 需要 "${permissionName}"，持有: [${permissions.join(', ')}]`);
        res.error(403010003004, `Forbidden: Missing permission "${permissionName}"`);
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
