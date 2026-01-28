import type { Request, Response, NextFunction } from 'express';
import { UsersService } from '#app/Services/Users/UsersService';
import { Crypto } from '#utils/crypto';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.error(401009014001, 'Unauthorized: Missing Token');
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    // 1. 解密获取原始 Payload (包含 token 和 timeStamp)
    const decryptedResult = Crypto.decryptToken(token);
    // 2. 基础合法性校验
    if (!decryptedResult || !decryptedResult.token || !decryptedResult.timeStamp) {
      res.error(401009014002, 'Unauthorized: Invalid Token Structure');
      return;
    }
    // 3. 类型安全检查
    if (typeof decryptedResult.timeStamp !== 'number') {
      res.error(401009014003, 'Unauthorized: Invalid Timestamp');
      return;
    }
    // 4. 过期校验 (强制拦截)
    const now = Math.floor(Date.now() / 1000);
    if (now > decryptedResult.timeStamp) {
      res.error(401009014004, 'Unauthorized: Token Expired');
      return;
    }
    const userRow = await UsersService.getToken(decryptedResult.token);
    if (!userRow) {
      res.error(401009014005, 'Unauthorized: Invalid Token');
      return;
    }
    if (userRow.status === 0) {
      res.error(400008012002, 'User is disabled');
    }
    // 5. 将解析后的信息挂载到 req 对象
    (req as any).currentUser = userRow;
    (req as any).tokenPayload = decryptedResult;
    next();
  } catch (error) {
    next(error);
  }
};