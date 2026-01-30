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
        userRow = await UsersService.findByUuid(uuid);
      } else if (account) {
        userRow = await UsersService.findByAccount(account);
      }
      // console.log('userRow:', userRow.withGraphJoined('roles.permissions'));
      if (!userRow) {
        res.error(404009003001, 'User not found');
        return;
      }
      res.success(userRow);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let inputData: any = req.body;
      try {
        inputData = await new UserSaveRequest(req).validate();
      } catch (err) {
        res.error(400009003002, JSON.stringify(err));
        return;
      }
      if (!inputData.roles && req.body.roles) {
        inputData.roles = req.body.roles;
      }
      const result = await UsersService.create(inputData);
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  public static async modify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let inputData: any = req.body;
      if (!inputData.id) {
        res.error(400009003003, 'id｜uuid Not Empty');
        return;
      }
      try {
        inputData = await new UserSaveRequest(req).validate();
      } catch (err) {
        res.error(400009003002, JSON.stringify(err));
        return;
      }
      if (!inputData.roles && req.body.roles) {
        inputData.roles = req.body.roles;
      }
      const result = await UsersService.modifyById(inputData.id, inputData);
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  public static async enable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body.filters) {
        res.error(400009003005, 'filters Not Empty');
        return;
      }
      const result = await UsersService.modifyByFilters(req.body.filters, { status: 1 });
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  public static async disable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body.filters) {
        res.error(400009003006, 'filters Not Empty');
        return;
      }
      const result = await UsersService.modifyByFilters(req.body.filters, { status: 0 });
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body.filters) {
        res.error(400009003007, 'filters Not Empty');
        return;
      }
      const result = await UsersService.deleteByFilters(req.body.filters);
      res.success(result);
    } catch (error) {
      next(error);
    }
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
    try {
      if (!req.body.filters) {
        res.error(400009003008, 'filters Not Empty');
        return;
      }
      const result = await UsersService.restoreByFilters(req.body.filters);
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  public static async forceDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body.filters) {
        res.error(400009003009, 'filters Not Empty');
        return;
      }
      const result = await UsersService.forceDelete(req.body.filters);
      res.success(result);
    } catch (error) {
      next(error);
    }
  }
}