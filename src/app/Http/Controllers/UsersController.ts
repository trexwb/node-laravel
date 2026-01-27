import type { Request, Response, NextFunction } from 'express';
import { UsersService } from '#app/Services/Users/UsersService';

export class UsersController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reqObj = (req as any);
      const { filter, page, pageSize, sort } = reqObj.body;
      const list = await UsersService.getList(filter, page, pageSize, sort);
      res.success(list);
    } catch (error) {
      next(error);
    }
  }

  public static async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reqObj = (req as any);
      const { id, uuid, account } = reqObj.body;
      let userRow = null;
      if (id) {
        userRow = await UsersService.getList(id);
      } else if (uuid) {
        userRow = await UsersService.getUuid(uuid);
      } else if (account) {
        userRow = await UsersService.getAccount(account);
      }
      if (!userRow) {
        res.error(404005013001, 'User not found');
        return;
      }
      res.success(userRow);
    } catch (error) {
      next(error);
    }
  }
}