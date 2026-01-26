import { Router } from 'express';
import { decryptRequest } from '#app/Http/Middleware/DecryptRequest';
import { UserController } from '#app/Http/Controllers/UserController';

const router = Router();

router.post('/signIn', decryptRequest, UserController.signIn);

export default router;