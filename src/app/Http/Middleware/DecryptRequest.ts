/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/app/Http/Middleware/DecryptRequest.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Request, Response, NextFunction } from 'express';
import { config } from '#bootstrap/configLoader';
import { Crypto } from '#utils/Crypto';
import { logger } from '#utils/Logger';

export const decryptRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const isEnabled = config('app.security.request_encrypt');
  if (!isEnabled || req.method === 'GET') {
    next();
    return;
  }

  // 从 body 或 header 中获取加密数据
  const encryptedData = (req.body as any)?.encryptData as string | undefined;
  const rawBody = req.headers['x-encrypted-body'] as string | undefined;
  const targetData = encryptedData || rawBody;

  if (!targetData || typeof targetData !== 'string') {
    next();
    return;
  }

  try {
    const appKey = req.secretRow?.appSecret || config('app.security.app_key');
    const appIv = req.secretRow?.appIv || config('app.security.app_iv');
    const decrypted = Crypto.decrypt(targetData, appKey, appIv);

    if (!decrypted) {
      res.error(401010004001, 'Data decryption failed: invalid format or key mismatch');
      return;
    }

    // 解密后合并到 body（保留原始字段）
    req.body = { ...decrypted, ...req.body };
    logger.debug(`[DecryptRequest] req.id=${req.id} 解密成功`);
    next();
  } catch (err) {
    logger.error(`[DecryptRequest] 解密异常:`, err);
    res.error(401010004001, 'Data decryption failed');
  }
};
