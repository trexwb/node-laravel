import type { Request, Response, NextFunction } from 'express';
import { Crypto } from '#utils/Crypto';
import { config } from '#bootstrap/configLoader';

export const refreshToken = (req: Request, res: Response, next: NextFunction) => {
  const tokenTime = config('app.security.token_time');
  // 1. 从请求中获取当前的 User 对象（假设前面的 Authenticate 中间件已解析并注入）
  const currentUser = (req as any).currentUser;
  const currentTokenPayload = (req as any).tokenPayload; // 假设解析 Token 时把原始 payload 存了进来
  // 拦截响应
  const originalJson = res.json;
  res.json = function (body): Response {
    if (currentUser && currentTokenPayload && currentTokenPayload.timeStamp) {
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = currentTokenPayload.timeStamp - now;
      // 2. 刷新策略：如果剩余有效期不足总时长的 1/2，则进行无感续期
      if (timeLeft > 0 && timeLeft < (tokenTime / 2)) {
        const newTokenData = {
          token: currentUser.rememberToken,
          timeStamp: now + tokenTime
        };
        console.log('newTokenData', newTokenData);
        const newToken = Crypto.generateToken(JSON.stringify(newTokenData));
        // 3. 注入 Header
        if (newToken !== undefined && newToken !== null) {
          res.setHeader('X-New-Token', newToken);
          // 必须暴露 Header，否则前端 Axios 等库无法读取自定义 Header
          res.setHeader('Access-Control-Expose-Headers', 'X-New-Token');
        }
      }
    }
    return originalJson.call(this, body);
  };
  next();
};