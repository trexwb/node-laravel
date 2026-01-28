import type { Request, Response, NextFunction } from 'express';
import { config } from '#bootstrap/configLoader';
import { Crypto } from '#utils/crypto';

export const decryptRequest = (req: Request, res: Response, next: NextFunction) => {
  // 1. 检查环境变量
  const isEnabled = config('app.security.request_encrypt');
  if (!isEnabled || req.method === 'GET') return next();
  // 2. 获取加密数据 (通常前端会将加密后的字符串放在 body 的某个字段，或直接作为整个 body)
  const encryptedData = req.body.encryptData || req.body;
  if (!encryptedData || typeof encryptedData !== 'string') {
    return next(); // 如果不是字符串或没有数据，跳过
  }
  try {
    const appKey = (req as any).secretRow?.appSecret || config('app.security.app_key');
    const appIv = (req as any).secretRow?.appIv || config('app.security.app_iv');
    // 3. 执行解密
    req.body = Crypto.decrypt(encryptedData, appKey, appIv);
    next();
  } catch (error) {
    next(error);
  }
};