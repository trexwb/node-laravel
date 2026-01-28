import type { Request, Response, NextFunction } from 'express';

export const can = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const reqObj = (req as any);
    const user = reqObj.currentUser;
    if (!user) {
      res.error(401009015001, 'Unauthorized');
      return;
    }
    const roles = user.roles || [];
    if (!roles || !roles.length) {
      res.error(401009015002, 'Unauthorized');
      return;
    }
    const permissions: string[] = roles.flatMap((role: { permissions: any[]; }) =>
      role.permissions.map(p => `${p.key}:${p.operation}`)
    );
    if (!permissions || !permissions.length) {
      res.error(401009015003, 'Unauthorized');
      return;
    }
    // console.log('user:', JSON.stringify(permissions), permissionName)
    try {
      // 校验权限
      if (!permissions.includes(permissionName)) {
        res.error(403009015004, `Forbidden: Missing permission`);
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};