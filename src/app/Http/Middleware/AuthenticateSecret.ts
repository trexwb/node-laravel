import type { Request, Response, NextFunction } from 'express';
import { Crypto } from '#utils/crypto';
import { config } from '#bootstrap/configLoader';
import { SecretsService } from '#app/Services/SecretsService';

export const authenticateSecret = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  // 1. 获取 Headers
  const appId = req.headers['app-id'] as string;
  const appSecret = req.headers['app-secret'] as string; // 这里实际传的是签名后的密文

  if (!appId || !appSecret) {
    return res.error(401006014001, 'appId/appSecret is empty');
  }

  // 2. 提取时间戳 (根据你的逻辑：密文的最后 10 位是时间戳)
  const timeStampStr = appSecret.substring(32);
  const timeStamp = parseInt(timeStampStr) || 0;
  const tokenTime = parseInt(config('app.security.token_time') || '1800');

  // 3. 校验时间戳是否过期
  const now = Math.floor(Date.now() / 1000);
  if (timeStamp < now - tokenTime) {
    return res.error(401006014002, 'appSecret expiration');
  }

  // 4. 从数据库/缓存获取原始 Secret
  // 假设你已经定义了 secretsHelper 或者直接使用 Model
  const secretRow = await SecretsService.getAppId(parseInt(appId));

  if (!secretRow) {
    return res.error(401006014003, 'appId/appSecret error');
  }

  if (!secretRow.status) {
    return res.error(403006014001, 'appSecret has been disabled',);
  }

  // 5. 核心：校验签名算法
  const expectedSecret = Crypto.md5(Crypto.md5(secretRow?.appId.toString() + timeStampStr) + secretRow?.appSecret.toString()) + timeStampStr;

  if (appSecret !== expectedSecret) {
    return res.error(401006014004, 'appSecret verification failed');
  }

  // 6. 鉴权通过，挂载数据供后续使用
  (req as any).secretRow = secretRow;
  next();
};