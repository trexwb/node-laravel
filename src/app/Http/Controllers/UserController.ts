import type { Request, Response, NextFunction } from 'express';
import { UsersService } from '#app/Services/Users/UsersService';
import { container } from '#bootstrap/app';
import { config } from '#bootstrap/configLoader';
import { Crypto } from '#utils/crypto'
import * as _ from 'lodash-es';

export class UserController {
  public static async signIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { account, password } = req.body;
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
      container.events.emit('writeLogs', { ...userRow, postAccount: account, postPassword: password }, 'authorize_signIn');

      // 更新token
      const token = await UsersService.updateToken(userRow);
      const now = Math.floor(Date.now() / 1000);
      const tokenTime = config('app.security.token_time');
      const newToken = Crypto.generateToken(JSON.stringify({
        token: token,
        timeStamp: now + tokenTime
      }));
      res.success({
        token: newToken,
        uuid: userRow.uuid
      });
    } catch (error) {
      // 5. 抛出异常由全局 Exception Handler 捕获
      next(error);
    }
  }
}