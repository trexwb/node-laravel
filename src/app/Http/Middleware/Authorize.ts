import type { Request, Response, NextFunction } from 'express';

export const can = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const currentUser = (req as any).currentUser;
    if (!currentUser) {
      res.error(401010003001, 'Unauthorized');
      return;
    }
    const roles = currentUser.roles || [];
    if (!roles || !roles.length) {
      res.error(401010003002, 'Unauthorized');
      return;
    }
    const permissions: string[] = roles.flatMap((role: { permissions: any[]; }) =>
      role.permissions.map(p => `${p.key}:${p.operation}`)
    );
    if (!permissions || !permissions.length) {
      res.error(401010003003, 'Unauthorized');
      return;
    }
    try {
      // 校验权限
      if (!permissions.includes(permissionName)) {
        res.error(403010003004, `Forbidden: Missing permission`);
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};