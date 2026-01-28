import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { SendWelcomeEmail } from '#app/Jobs/SendWelcomeEmail';
import { authenticateToken } from '#app/Http/Middleware/AuthenticateToken';
import { decryptRequest } from '#app/Http/Middleware/DecryptRequest';
import { nowInTz } from '#app/Helpers/Format';
import { Crypto } from '#utils/crypto';
import { config } from '#bootstrap/configLoader';
import { UsersService } from '#app/Services/Users/UsersService';

const router = Router();

// 使用解密请求中间件
// router.use(decryptRequest);

router.post('/', [decryptRequest, authenticateToken], async (_req: Request, res: Response, _next: NextFunction) => {
  res.success();
});

if (config('app.env') == 'development') {
  router.post('/mockDate', [decryptRequest, authenticateToken], async (req: Request, res: Response, _next: NextFunction) => {
    if (req.query.action === 'create') {
      await SendWelcomeEmail.dispatch({ task: 'hello', timestamp: nowInTz() });
    }
    res.success({ mockDate: 'create', task: 'hello', timestamp: nowInTz() });
  });

  router.post('/mockToken', async (_req: Request, res: Response, _next: NextFunction) => {
    const tokenTime = config('app.security.token_time');
    const userRow = await UsersService.findById(1);
    const now = Math.floor(Date.now() / 1000);
    const newTokenData = {
      token: userRow?.rememberToken, // 根据你的业务 logic
      timeStamp: now + tokenTime
    };
    const newToken = Crypto.generateToken(JSON.stringify(newTokenData));
    res.success(newToken);
  });
}


export default router;