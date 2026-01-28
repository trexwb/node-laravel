import type { Request, Response, NextFunction } from 'express';
import { config } from '#bootstrap/configLoader';
import { Crypto } from '#utils/Crypto'
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
  const isEnabled = config('app.security.verify_signature');
  if (!isEnabled) return next();
  // 提取业务参数 (Query + Body)
  const params = { ...req.query, ...req.body };
  if (Object.keys(params).length === 0) return next();
  // 从 Headers 获取签名和时间戳
  const sign = req.headers['x-sign'] as string;
  if (!sign) {
    return res.error(403009010001, 'Signature missing');
  }
  // 签名算法：参数排序 -> 加上时间戳 -> 拼接 -> HMAC
  const appKey = (req as any).secretRow?.appSecret || config('app.security.app_key');
  // 按照字母顺序排序键
  const sortedParams = sortObjectDeep(params);
  // const sortedParams = fromPairs(sortBy(toPairs(params), 0));
  // 待签名字符串包含：参数序列化 + 密钥
  const serverSign = Crypto.md5(Crypto.sha256(JSON.stringify(sortedParams)) + appKey);
  if (sign !== serverSign) {
    return res.error(403009010002, 'Invalid signature');
  }
  next();
};