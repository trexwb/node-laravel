import type { Request, Response, NextFunction } from 'express';
import { UsersService } from '#app/Services/Users/UsersService';
import { config } from '#bootstrap/configLoader';
import { Crypto } from '#utils/Crypto'
import * as _ from 'lodash-es';

export class AuthorizeController {
  public static async signIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { account, password } = req.body;
      if (!account || !password) {
        res.error(400008011001, 'Account Or Password is required');
        return;
      }
      const userRow = await UsersService.getAccount(account);
      if (!userRow) {
        res.error(400008011002, 'Account number does not exist');
        return;
      }
      if (Crypto.md5(password + userRow.salt.toString()) !== userRow.password) {
        res.error(400008011003, 'Wrong password');
        return;
      }
      // 触发 Event (异步解耦，操作日志)
      (req as any).eventEmitter.emit('writeLogs', { ...userRow, post: { account, password } }, 'authorize_signIn');
      // 更新token
      const token = await UsersService.updateToken(userRow);
      const now = Math.floor(Date.now() / 1000);
      const tokenTime = config('app.security.token_time');
      const newToken = Crypto.generateToken(JSON.stringify({
        token: token,
        timeStamp: now + tokenTime
      }));
      res.success({ token: newToken, uuid: userRow.uuid });
    } catch (error) {
      next(error);
    }
  }

  public static async signSecret(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { uuid, secret } = req.body;
      if (!uuid || !secret) {
        res.error(400008011004, 'Account Or Password is required');
        return;
      }
      const userRow = await UsersService.getUuid(uuid);
      if (!userRow) {
        res.error(400008011005, 'Account number does not exist');
        return;
      }
      if (secret !== Crypto.md5(userRow.secret)) {
        res.error(400008011006, 'Wrong password');
        return;
      }
      // 触发 Event (异步解耦，操作日志)
      (req as any).eventEmitter.emit('writeLogs', { ...userRow, post: { uuid, secret } }, 'authorize_signSecret');
      // 更新token
      const token = await UsersService.updateToken(userRow);
      const now = Math.floor(Date.now() / 1000);
      const tokenTime = config('app.security.token_time');
      const newToken = Crypto.generateToken(JSON.stringify({
        token: token,
        timeStamp: now + tokenTime
      }));
      res.success({ token: newToken, uuid: userRow.uuid });
    } catch (error) {
      next(error);
    }
  }

  public static async signInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).currentUser) {
        res.error(401008011001, 'User Error');
        return;
      }
      res.success((req as any).currentUser);
    } catch (error) {
      next(error);
    }
  }

  public static async signOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).currentUser) {
        res.error(401008011002, 'User Error');
        return;
      }
      // 触发 Event (异步解耦，操作日志)
      (req as any).eventEmitter.emit('writeLogs', { ...(req as any).currentUser }, 'authorize_signOut');
      // 更新token
      await UsersService.updateToken((req as any).currentUser);
      res.success();
    } catch (error) {
      next(error);
    }
  }
}