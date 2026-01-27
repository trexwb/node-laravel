import { Router } from 'express';
import { decryptRequest } from '#app/Http/Middleware/DecryptRequest';
import { authenticateToken } from '#app/Http/Middleware/AuthenticateToken';
import { AuthorizeController } from '#app/Http/Controllers/AuthorizeController';

const router = Router();

router.post('/signIn', decryptRequest, AuthorizeController.signIn);

router.post('/signSecret', decryptRequest, AuthorizeController.signSecret);

router.post('/signOut', authenticateToken, AuthorizeController.signOut);

router.post('/signInfo', authenticateToken, decryptRequest, AuthorizeController.signInfo);

export default router;