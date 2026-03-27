/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/app/Http/Middleware/VerifySignature.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Request, Response, NextFunction } from 'express';
import { config } from '#bootstrap/configLoader';
import { Crypto } from '#utils/Crypto';
import { logger } from '#utils/Logger';

// 深度递归排序（保证签名一致性）
function sortObjectDeep(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectDeep);
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortObjectDeep(v)])
    );
  }
  return obj;
}

export const verifySignature = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const isEnabled = config('app.security.verify_signature');
  if (!isEnabled) {
    next();
    return;
  }

  // 合并 Query + Body 作为签名内容
  const params = { ...req.query, ...req.body };
  if (Object.keys(params).length === 0) {
    next();
    return;
  }

  const sign = req.headers['x-sign'] as string;
  if (!sign) {
    res.error(403010010001, 'Signature missing');
    return;
  }

  // 使用 secretRow 中的 appSecret（如已通过 AuthenticateSecret 验证）
  // 否则使用全局配置中的 app_key
  const appSecret = req.secretRow?.appSecret || config('app.security.app_key');

  const sortedParams = sortObjectDeep(params);
  const serverSign = Crypto.md5(Crypto.sha256(JSON.stringify(sortedParams)) + appSecret);

  if (sign !== serverSign) {
    logger.warn(
      `[Signature] 签名校验失败 req.id=${req.id} ` +
      `client=${sign.substring(0, 8)}... server=${serverSign.substring(0, 8)}...`
    );
    res.error(403010010002, 'Invalid signature');
    return;
  }

  next();
};
