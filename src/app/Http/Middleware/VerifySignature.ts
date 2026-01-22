import { Request, Response, NextFunction } from 'express';
import { container } from '@bootstrap/app';
import crypto from 'node:crypto';
import { toPairs, sortBy, fromPairs } from 'lodash-es';

export const verifySignature = (req: Request, res: Response, next: NextFunction) => {
  const isEnabled = container.config('app.security.request_encrypt');

  if (!isEnabled) return next();

  // 1. 获取前端传来的签名和参数
  const { sign, ...params } = { ...req.query, ...req.body };

  if (!sign) {
    return res.status(403).json({ msg: 'Signature missing', data: null });
  }

  // 2. 签名算法：参数排序 -> 拼接 -> HMAC/SHA256
  // 注意：这里需要使用 .env 中的 APP_KEY 作为秘钥
  const appKey = container.config('app.security.app_key');

  const sortedParams = fromPairs(sortBy(toPairs(params), 0));

  const queryString = JSON.stringify(sortedParams);
  const serverSign = crypto
    .createHmac('sha256', appKey)
    .update(queryString)
    .digest('hex');

  if (sign !== serverSign) {
    return res.status(403).json({ msg: 'Invalid signature', data: null });
  }

  next();
};