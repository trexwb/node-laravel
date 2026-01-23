import type { Request, Response, NextFunction } from 'express';
import { Crypto } from '#utils/crypto';
import { config } from '#bootstrap/configLoader';

export const refreshToken = (req: Request, res: Response, next: NextFunction) => {
  const appConfig = config('app.security');
  const tokenTime = Number(appConfig.token_time || 1800);

  // 1. 从请求中获取当前的 User 对象（假设前面的 Authenticate 中间件已解析并注入）
  const user = (req as any).user;
  const currentTokenPayload = (req as any).tokenPayload; // 假设解析 Token 时把原始 payload 存了进来

  // 拦截响应
  const originalJson = res.json;
  const appKey = (req as any).secretRow?.appSecret || config('app.security.app_key');
  const appIv = (req as any).secretRow?.appIv || config('app.security.app_iv');

  res.json = function (body): Response {
    if (user && currentTokenPayload && currentTokenPayload.timeStamp) {
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = currentTokenPayload.timeStamp - now;

      /**
       * 2. 刷新策略：
       * 如果剩余有效期不足总时长的 1/2，则进行无感续期
       */
      if (timeLeft > 0 && timeLeft < (tokenTime / 2)) {
        const newTokenData = {
          token: user.remember_token || user.id, // 根据你的业务 logic
          timeStamp: now + tokenTime
        };

        // const newToken = Crypto.generateToken(JSON.stringify(newTokenData));
        const newToken = Crypto.encrypt(newTokenData, appKey, appIv);

        // 3. 注入 Header
        if (newToken !== undefined && newToken !== null) {
          res.setHeader('X-New-Token', newToken);
          // 必须暴露 Header，否则前端 Axios 等库无法读取自定义 Header
          res.setHeader('Access-Control-Expose-Headers', 'X-New-Token');
          console.log(`[Token] 🚀 User ${user.id} token refreshed. Remaining: ${timeLeft}s`);
        } else {
          console.warn('[Token] ⚠️ Token encryption failed, skipping refresh header');
        }
      }
    }

    return originalJson.call(this, body);
  };

  next();
};