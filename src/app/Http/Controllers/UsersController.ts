import type { Request, Response, NextFunction } from 'express';
import { UsersService } from '#app/Services/Users/UsersService';

export class UsersController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reqObj = (req as any);
      const { filter, page, pageSize, sort } = reqObj.body;
      const list = await UsersService.getList(filter, page, pageSize, sort, false);
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
        userRow = await UsersService.getId(id);
      } else if (uuid) {
        userRow = await UsersService.getUuid(uuid);
      } else if (account) {
        userRow = await UsersService.getAccount(account);
      }
      // console.log('userRow:', userRow.withGraphJoined('roles.permissions'));
      if (!userRow) {
        res.error(404008012001, 'User not found');
        return;
      }
      res.success(userRow);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    console.log(req, res, next)
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    console.log(req, res, next)
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    console.log(req, res, next)
  }

  public static async trashList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reqObj = (req as any);
      const { filter, page, pageSize, sort } = reqObj.body;
      const list = await UsersService.getList(filter, page, pageSize, sort, true);
      res.success(list);
    } catch (error) {
      next(error);
    }
  }

  public static async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    console.log(req, res, next)
  }

  public static async forceDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    console.log(req, res, next)
  }
}