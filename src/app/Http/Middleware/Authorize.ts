import type { Request, Response, NextFunction } from 'express';

export const can = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRow = (req as any).currentUser;
    if (!userRow) {
      res.error(401009003001, 'Unauthorized');
      return;
    }
    const roles = userRow.roles || [];
    if (!roles || !roles.length) {
      res.error(401009003002, 'Unauthorized');
      return;
    }
    const permissions: string[] = roles.flatMap((role: { permissions: any[]; }) =>
      role.permissions.map(p => `${p.key}:${p.operation}`)
    );
    if (!permissions || !permissions.length) {
      res.error(401009003003, 'Unauthorized');
      return;
    }
    try {
      // 校验权限
      if (!permissions.includes(permissionName)) {
        res.error(403009003004, `Forbidden: Missing permission`);
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};