import { Router } from 'express';
import { authenticateToken } from '#app/Http/Middleware/AuthenticateToken';
import { UserController } from '#app/Http/Controllers/UserController';

const router = Router();

router.post('/register', UserController.register);

// 这里的路径是相对于文件名的，即：GET /api/user/profile
router.get('/profile', authenticateToken, (_req, res) => {
  res.json({ id: 1, name: 'Hello' });
});

export default router;