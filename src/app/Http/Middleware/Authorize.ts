import type { Request, Response, NextFunction } from 'express';
import { UsersModel } from '#app/Models/UsersModel';
import { CacheService } from '#app/Services/Cache/CacheService';

// 定义权限相关的类型接口
interface Permission {
  name: string;
}

interface Role {
  id: number;
  permissions: Permission[];
}

interface UserModelWithRoles extends UsersModel {
  roles?: Role[];
}

export const can = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const reqObj = (req as any);
    const user = reqObj.currentUser;
    if (!user) {
      res.error(401009015001, 'Unauthorized');
      return;
    }
    try {
      // 1. 尝试从缓存获取用户的权限列表
      const cacheKey = `user_perms:${user.id}`;
      const permissions = await CacheService.remember(cacheKey, 3600, async () => {
        // console.log(await UsersModel.query().findById(user.id).withGraphJoined('roles.permissions').debug(), [user.id]);
        // 直接在中间件里处理关联查询
        const result = await UsersModel.query().findById(user.id).withGraphJoined('roles.permissions') as UserModelWithRoles | undefined;
        const perms: string[] = [];
        result?.roles?.forEach((role: any) => {
          role.permissions?.forEach((p: any) => perms.push(`${p.key}:${p.operation}`));
        });
        return perms;
      });
      // 2. 校验权限
      if (!permissions.includes(permissionName)) {
        res.error(403009015001, `Forbidden: Missing permission [${permissionName}]`);
        return;
      }
      next();
    } catch (error) {
      res.error(500009015001, 'Authorization check failed');
      return;
    }
  };
};