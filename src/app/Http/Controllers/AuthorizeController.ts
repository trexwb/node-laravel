import type { Request, Response, NextFunction } from 'express';
import { UsersService } from '#app/Services/Users/UsersService';
import { config } from '#bootstrap/configLoader';
import { Crypto } from '#utils/crypto'
import * as _ from 'lodash-es';

export class AuthorizeController {
  public static async signIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reqObj = (req as any);
      const { account, password } = reqObj.body;
      if (!account || !password) {
        res.error(400005015001, 'Account Or Password is required');
        return;
      }
      const userRow = await UsersService.getAccount(account);
      if (!userRow) {
        res.error(400005015002, 'Account number does not exist');
        return;
      }
      if (Crypto.md5(password + userRow.salt.toString()) !== userRow.password) {
        res.error(400005015003, 'Wrong password');
        return;
      }
      // 触发 Event (异步解耦，操作日志)
      reqObj.eventEmitter.emit('writeLogs', { ...userRow, post: { account, password } }, 'authorize_signIn');
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
      const reqObj = (req as any);
      const { uuid, secret } = reqObj.body;
      if (!uuid || !secret) {
        res.error(400005015004, 'Account Or Password is required');
        return;
      }
      const userRow = await UsersService.getUuid(uuid);
      if (!userRow) {
        res.error(400005015005, 'Account number does not exist');
        return;
      }
      if (secret !== Crypto.md5(userRow.secret)) {
        res.error(400005015006, 'Wrong password');
        return;
      }
      // 触发 Event (异步解耦，操作日志)
      reqObj.eventEmitter.emit('writeLogs', { ...userRow, post: { uuid, secret } }, 'authorize_signSecret');
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
      const reqObj = (req as any);
      if (!reqObj.currentUser) {
        res.error(401005015001, 'User Error');
        return;
      }
      res.success(reqObj.currentUser);
    } catch (error) {
      next(error);
    }
  }

  public static async signOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reqObj = (req as any);
      if (!reqObj.currentUser) {
        res.error(401005015002, 'User Error');
        return;
      }
      // 触发 Event (异步解耦，操作日志)
      reqObj.eventEmitter.emit('writeLogs', { ...reqObj.currentUser }, 'authorize_signOut');
      // 更新token
      await UsersService.updateToken(reqObj.currentUser);
      res.success();
    } catch (error) {
      next(error);
    }
  }
}