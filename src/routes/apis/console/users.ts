import { Router } from 'express';
import { decryptRequest } from '#app/Http/Middleware/DecryptRequest';
import { authenticateToken } from '#app/Http/Middleware/AuthenticateToken';
import { can } from '#app/Http/Middleware/Authorize';
import { UsersController } from '#app/Http/Controllers/UsersController';

const router = Router();

router.post('/list', [authenticateToken, decryptRequest, can('accountsUsers:read')], UsersController.list);

router.post('/detail', [authenticateToken, decryptRequest, can('accountsUsers:read')], UsersController.detail);

export default router;