/*
 * @Author: trexwb
 * @Date: 2026-01-22 14:24:57
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:48:42
 * @FilePath: /node-laravel/src/app/Http/Middleware/AuthenticateSecret.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Request, Response, NextFunction } from 'express';
import { Crypto } from '#utils/Crypto';
import { config } from '#bootstrap/configLoader';
import { SecretsService } from '#app/Services/Secrets/SecretsService';

export const authenticateSecret = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  // 1. 获取 Headers
  const appId = req.headers['app-id'] as string;
  const appSecret = req.headers['app-secret'] as string; // 这里实际传的是签名后的密文
  if (!appId || !appSecret) {
    return res.error(401010001001, 'appId/appSecret is empty');
  }
  // 2. 提取时间戳 (根据你的逻辑：密文的最后 10 位是时间戳)
  const timeStampStr = appSecret.substring(32);
  const timeStamp = parseInt(timeStampStr) || 0;
  const tokenTime = parseInt(config('app.security.token_time') || '1800');
  // 3. 校验时间戳是否过期
  const now = Math.floor(Date.now() / 1000);
  if (timeStamp < now - tokenTime) {
    return res.error(401010001002, 'appSecret expiration');
  }
  // 4. 从数据库/缓存获取原始 Secret
  // 假设你已经定义了 secretsHelper 或者直接使用 Model
  const secretRow = await SecretsService.findByAppId(Number(appId));
  if (!secretRow || !secretRow.appId || !secretRow.appSecret) {
    return res.error(401010001003, 'appId/appSecret error');
  }
  if (!secretRow.status) {
    return res.error(403010001001, 'appSecret has been disabled',);
  }
  // 5. 核心：校验签名算法
  const appStr = Crypto.sha256(`${secretRow.appId}${timeStampStr}`);
  const expectedSecret = Crypto.md5(`${appStr}${secretRow.appSecret}`) + timeStampStr;
  if (appSecret !== expectedSecret) {
    return res.error(401010001004, 'appSecret verification failed');
  }
  // 6. 鉴权通过，挂载数据供后续使用
  (req as any).secretRow = secretRow;
  next();
};