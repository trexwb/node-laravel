import type { Request, Response, NextFunction } from 'express';
import { Crypto } from '#utils/crypto';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ msg: 'Unauthorized: Missing Token', data: null });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. 解密获取原始 Payload (包含 token 和 timeStamp)
    const decryptedResult = Crypto.decryptToken(token);

    // 2. 基础合法性校验
    if (!decryptedResult || !decryptedResult.token || !decryptedResult.timeStamp) {
      res.status(401).json({ msg: 'Unauthorized: Invalid Token Structure', data: null });
      return;
    }

    // 3. 类型安全检查
    if (typeof decryptedResult.timeStamp !== 'number') {
      res.status(401).json({ msg: 'Unauthorized: Invalid Timestamp', data: null });
      return;
    }

    // 4. 过期校验 (强制拦截)
    const now = Math.floor(Date.now() / 1000);
    if (now > decryptedResult.timeStamp) {
      res.status(401).json({ msg: 'Unauthorized: Token Expired', data: null });
      return;
    }

    // 5. 将解析后的信息挂载到 req 对象
    (req as any).user = { id: decryptedResult.token };
    (req as any).tokenPayload = decryptedResult;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ msg: 'Unauthorized: Authentication Failed', data: null });
    return;
  }
};