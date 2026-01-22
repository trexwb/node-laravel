import type { Request, Response, NextFunction } from 'express';
import { Crypto } from '#utils/crypto';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): any => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.error(401, 'Unauthorized: Missing Token');
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. 解密获取原始 Payload (包含 token 和 timeStamp)
    const decryptedResult = Crypto.decryptToken(token);

    // 2. 基础合法性校验
    if (!decryptedResult || !decryptedResult.token || !decryptedResult.timeStamp) {
      return res.error(401, 'Unauthorized: Invalid Token Structure');
    }

    // 3. 类型安全检查
    if (typeof decryptedResult.timeStamp !== 'number') {
      return res.error(401, 'Unauthorized: Invalid Timestamp');
    }

    // 4. 过期校验 (强制拦截)
    const now = Math.floor(Date.now() / 1000);
    if (now > decryptedResult.timeStamp) {
      return res.error(401, 'Unauthorized: Token Expired');
    }

    // 5. 将解析后的信息挂载到 req 对象
    (req as any).user = { id: decryptedResult.token };
    (req as any).tokenPayload = decryptedResult;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.error(401, 'Unauthorized: Authentication Failed');
  }
};