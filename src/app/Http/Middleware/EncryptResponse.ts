import { Request, Response, NextFunction } from 'express';
import { container } from '@bootstrap/app';
import { Crypto } from '@utils/crypto';

export const encryptResponse = (_req: Request, res: Response, next: NextFunction) => {
  const isEnabled = container.config('app.security.return_encrypt');

  if (!isEnabled) return next();

  const originalJson = res.json;

  res.json = function (data: any): Response {
    if (data && data.data) {
      // 只加密统一格式中的 data 部分，保持 msg 结构可见
      data.encryptedData = Crypto.encrypt(JSON.stringify(data.data));
      delete data.data;
    }
    return originalJson.call(this, data);
  };

  next();
};