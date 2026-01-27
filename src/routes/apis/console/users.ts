import { Router } from 'express';
import { decryptRequest } from '#app/Http/Middleware/DecryptRequest';
import { authenticateToken } from '#app/Http/Middleware/AuthenticateToken';
import { UsersController } from '#app/Http/Controllers/UsersController';

const router = Router();

router.post('/list', [authenticateToken, decryptRequest], UsersController.list);

router.post('/detail', [authenticateToken, decryptRequest], UsersController.detail);

export default router;