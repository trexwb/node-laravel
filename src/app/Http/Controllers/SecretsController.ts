import type { Request, Response, NextFunction } from 'express';
import { SecretsService } from '#app/Services/Secrets/SecretsService';
import { SecretSaveRequest } from '#app/Http/Requests/SecretSaveRequest';

export class SecretsController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filters, page, pageSize, sort } = req.body;
      const list = await SecretsService.findMany(filters, page, pageSize, sort, false);
      res.success(list);
    } catch (error) {
      next(error);
    }
  }

  public static async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, appId } = req.body;
      let secretRow = null;
      if (id) {
        secretRow = await SecretsService.findById(id);
      } else if (appId) {
        secretRow = await SecretsService.findByAppId(appId);
      }
      if (!secretRow) {
        res.error(404009002001, 'User not found');
        return;
      }
      res.success(secretRow);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const form = new SecretSaveRequest(req);
      const data = await form.validate();
      if (!data) {
        res.error(400009002001, 'User Error');
        return;
      }
      const result = await SecretsService.create(data);
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  public static async modify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body.id) {
        res.error(400009002002, 'id Not Empty');
        return;
      }
      const form = new SecretSaveRequest(req);
      const data = await form.validate();
      if (!data) {
        res.error(400009002003, 'User Error');
        return;
      }
      const result = await SecretsService.modifyById(req.body.id, data);
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  public static async enable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body.filters) {
        res.error(400009002004, 'filters Not Empty');
        return;
      }
      const result = await SecretsService.modifyByFilters(req.body.filters, { status: 1 });
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  public static async disable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body.filters) {
        res.error(400009002005, 'filters Not Empty');
        return;
      }
      const result = await SecretsService.modifyByFilters(req.body.filters, { status: 0 });
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body.filters) {
        res.error(400009002006, 'filters Not Empty');
        return;
      }
      const result = await SecretsService.deleteByFilters(req.body.filters);
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  public static async trashList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filters, page, pageSize, sort } = req.body;
      const list = await SecretsService.findMany(filters, page, pageSize, sort, true);
      res.success(list);
    } catch (error) {
      next(error);
    }
  }

  public static async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body.filters) {
        res.error(400009002007, 'filters Not Empty');
        return;
      }
      const result = await SecretsService.restoreByFilters(req.body.filters);
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  public static async forceDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body.filters) {
        res.error(400009002008, 'filters Not Empty');
        return;
      }
      const result = await SecretsService.forceDelete(req.body.filters);
      res.success(result);
    } catch (error) {
      next(error);
    }
  }
}