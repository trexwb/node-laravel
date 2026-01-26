import { Router } from 'express';
import { decryptRequest } from '#app/Http/Middleware/DecryptRequest';
import { authenticateToken } from '#app/Http/Middleware/AuthenticateToken';
import { UserController } from '#app/Http/Controllers/UserController';

const router = Router();

router.post('/signIn', decryptRequest, UserController.signIn);

router.get('/signOut', authenticateToken, UserController.signOut);

router.get('/signInfo', authenticateToken, UserController.signInfo);

export default router;