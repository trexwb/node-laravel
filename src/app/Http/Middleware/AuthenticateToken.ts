/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/app/Http/Middleware/AuthenticateToken.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Request, Response, NextFunction } from 'express';
import { UsersService } from '#app/Services/Users/UsersService';
import { Crypto } from '#utils/Crypto';
import { logger } from '#utils/Logger';

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.error(401010002001, 'Unauthorized: Missing Token');
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. 解密获取原始 Payload
    const decryptedResult = Crypto.decryptToken(token);
    if (!decryptedResult || !decryptedResult.token || !decryptedResult.timeStamp) {
      res.error(401010002002, 'Unauthorized: Invalid Token Structure');
      return;
    }

    // 2. 类型安全检查
    if (typeof decryptedResult.timeStamp !== 'number') {
      res.error(401010002003, 'Unauthorized: Invalid Timestamp');
      return;
    }

    // 3. 过期校验
    const now = Math.floor(Date.now() / 1000);
    if (now > decryptedResult.timeStamp) {
      res.error(401010002004, 'Unauthorized: Token Expired');
      return;
    }

    // 4. 查找用户
    const userRow = await UsersService.findByToken(decryptedResult.token);
    if (!userRow) {
      res.error(401010002005, 'Unauthorized: Invalid Token');
      return;
    }

    if (userRow.status === 0) {
      res.error(400008012002, 'User is disabled');
      return;
    }

    // ✅ 注入到 req（类型已在 express.d.ts 中声明）
    req.currentUser = userRow;
    req.tokenPayload = {
      token: decryptedResult.token,
      timeStamp: decryptedResult.timeStamp,
    };

    logger.debug(`[Auth] User ${userRow.id} authenticated (req.id=${req.id})`);
    next();
  } catch (error) {
    logger.error(`[Auth] Token 验证异常:`, error);
    next(error);
  }
};
