/*
 * @Author: trexwb
 * @Date: 2026-01-22 14:24:57
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/app/Http/Middleware/AuthenticateSecret.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Request, Response, NextFunction } from 'express';
import { Crypto } from '#utils/Crypto';
import { config } from '#bootstrap/configLoader';
import { SecretsService } from '#app/Services/Secrets/SecretsService';
import { logger } from '#utils/Logger';

export const authenticateSecret = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const appId = req.headers['app-id'] as string;
  const appSecret = req.headers['app-secret'] as string;

  // 1. 参数校验
  if (!appId || !appSecret) {
    res.error(401010001001, 'appId/appSecret is empty');
    return;
  }

  // 2. 提取时间戳并校验是否过期
  const timeStampStr = appSecret.substring(32);
  const timeStamp = parseInt(timeStampStr) || 0;
  const tokenTime = parseInt(config('app.security.token_time') || '1800');
  const now = Math.floor(Date.now() / 1000);

  if (timeStamp < now - tokenTime) {
    res.error(401010001002, 'appSecret expired');
    return;
  }

  // 3. 从数据库/缓存获取原始 Secret
  const secretRow = await SecretsService.findByAppId(Number(appId));
  if (!secretRow || !secretRow.appId || !secretRow.appSecret) {
    res.error(401010001003, 'appId/appSecret error');
    return;
  }

  if (!secretRow.status) {
    res.error(403010001001, 'appSecret has been disabled');
    return;
  }

  // 4. 签名校验
  const appStr = Crypto.sha256(`${secretRow.appId}${timeStampStr}`);
  const expectedSecret = Crypto.md5(`${appStr}${secretRow.appSecret}`) + timeStampStr;
  if (appSecret !== expectedSecret) {
    logger.warn(`[AuthSecret] 签名校验失败 appId=${appId} req.id=${req.id}`);
    res.error(401010001004, 'appSecret verification failed');
    return;
  }

  // ✅ 注入到 req（类型已在 express.d.ts 中声明）
  req.secretRow = secretRow;
  logger.debug(`[AuthSecret] appId=${appId} authenticated req.id=${req.id}`);
  next();
};
