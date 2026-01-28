import type { Request, Response, NextFunction } from 'express';
import { UsersService } from '#app/Services/Users/UsersService';
import { UserSaveRequest } from '#app/Http/Requests/UserSaveRequest';

export class UsersController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filters, page, pageSize, sort } = req.body;
      const list = await UsersService.findMany(filters, page, pageSize, sort, false);
      res.success(list);
    } catch (error) {
      next(error);
    }
  }

  public static async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, uuid, account } = req.body;
      let userRow = null;
      if (id) {
        userRow = await UsersService.findById(id);
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
    try {
      const form = new UserSaveRequest(req);
      const data = await form.validate();
      if (!data) {
        res.error(400008012002, 'User Error');
        return;
      }
      const result = await UsersService.create(data);
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body.id) {
        res.error(400008012003, 'id Not Empty');
        return;
      }
      const form = new UserSaveRequest(req);
      const data = await form.validate();
      if (!data) {
        res.error(400008012004, 'User Error');
        return;
      }
      const result = await UsersService.updateById(req.body.id, data);
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  public static async enable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body.filters) {
        res.error(400008012005, 'filters Not Empty');
        return;
      }
      const result = await UsersService.updateByFilters(req.body.filters, { status: 1 });
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  public static async disable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body.filters) {
        res.error(400008012005, 'filters Not Empty');
        return;
      }
      const result = await UsersService.updateByFilters(req.body.filters, { status: 0 });
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  public static async sort(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body.filters) {
        res.error(400008012005, 'filters Not Empty');
        return;
      }
      const result = await UsersService.updateByFilters(req.body.filters, { status: 0 });
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    console.log(req, res, next)
  }

  public static async trashList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filters, page, pageSize, sort } = req.body;
      const list = await UsersService.findMany(filters, page, pageSize, sort, true);
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