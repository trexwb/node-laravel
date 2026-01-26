import type { Request, Response, NextFunction } from 'express';
import { config } from '#bootstrap/configLoader';
import { Crypto } from '#utils/crypto';

export const encryptResponse = (req: Request, res: Response, next: NextFunction) => {
  const isEnabled = config('app.security.return_encrypt');
  if (!isEnabled) return next();
  const originalJson = res.json;

  const appKey = (req as any).secretRow?.appSecret || config('app.security.app_key');
  const appIv = (req as any).secretRow?.appIv || config('app.security.app_iv');

  res.json = function (data: any): Response {
    if (data && data.data) {
      // 只加密统一格式中的 data 部分，保持 msg 结构可见
      data.encryptedData = Crypto.encrypt(JSON.stringify(data.data), appKey, appIv);
      delete data.data;
    }
    return originalJson.call(this, data);
  };

  next();
};