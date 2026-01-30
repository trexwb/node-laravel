import { Router } from 'express';
import { decryptRequest } from '#app/Http/Middleware/DecryptRequest';
import { authenticateToken } from '#app/Http/Middleware/AuthenticateToken';
import { AuthorizeController } from '#app/Http/Controllers/AuthorizeController';

const router = Router();

const decrypt = [decryptRequest];
const authDecrypt = [authenticateToken, decryptRequest];

router.post('/signIn', decrypt, AuthorizeController.signIn);

router.post('/signSecret', decrypt, AuthorizeController.signSecret);

router.post('/signOut', authDecrypt, AuthorizeController.signOut);

router.post('/signInfo', authDecrypt, AuthorizeController.signInfo);

export default router;