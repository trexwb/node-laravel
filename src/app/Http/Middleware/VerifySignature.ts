import type { Request, Response, NextFunction } from 'express';
import { container } from '#bootstrap/app';
import crypto from 'node:crypto';
// import { toPairs, sortBy, fromPairs } from 'lodash-es';

function sortObjectDeep(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectDeep); // 数组保持顺序，或可考虑排序
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortObjectDeep(v)])
    );
  } else {
    return obj;
  }
}

export const verifySignature = (req: Request, res: Response, next: NextFunction) => {
  const isEnabled = container.config('app.security.request_encrypt');
  if (!isEnabled) return next();

  // 1. 从 Headers 获取签名和时间戳
  const sign = req.headers['x-sign'] as string;
  const timestamp = req.headers['x-timestamp'] as string;

  if (!sign || !timestamp) {
    return res.error(403, 'Signature or Timestamp missing');
  }

  // 2. 验证时间戳（防止超过 5 分钟的请求，提高安全性）
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return res.error(403, 'Request expired');
  }

  // 3. 提取业务参数 (Query + Body)
  const params = { ...req.query, ...req.body };

  // 4. 签名算法：参数排序 -> 加上时间戳 -> 拼接 -> HMAC
  const appKey = container.config('app.security.app_key');

  // 按照字母顺序排序键
  const sortedParams = sortObjectDeep(params);
  // const sortedParams = fromPairs(sortBy(toPairs(params), 0));

  // 待签名字符串包含：时间戳 + 参数序列化
  const stringToSign = `${timestamp}${JSON.stringify(sortedParams)}`;

  const serverSign = crypto
    .createHmac('sha256', appKey)
    .update(stringToSign)
    .digest('hex');

  if (sign !== serverSign) {
    return res.error(403, 'Invalid signature');
  }

  next();
};