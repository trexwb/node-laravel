import { Router } from 'express';
import path from 'node:path';
import { loadDynamicRoutes } from '#bootstrap/routeLoader';
import { throttle } from '#app/Http/Middleware/Throttle';
import { authenticateSecret } from '#app/Http/Middleware/AuthenticateSecret';
import { refreshToken } from '#app/Http/Middleware/RefreshToken';
import { verifySignature } from '#app/Http/Middleware/VerifySignature';
import { encryptResponse } from '#app/Http/Middleware/EncryptResponse';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// 使用刷新令牌中间件
router.use(refreshToken);

// 自动加载 ./apis 目录下的所有路由文件
// 例如: ./apis/auth.ts 会被映射到 /api/auth
async function initializeRoutes() {
  const apisDir = path.join(__dirname, 'apis');
  const dynamicApiRoutes = await loadDynamicRoutes(apisDir);
  router.use('/', throttle(60, 1), authenticateSecret, verifySignature, encryptResponse, dynamicApiRoutes);
  // 全局应用加密响应（放在所有 API 路由前）
  // router.use(encryptResponse);
}

// 执行初始化
initializeRoutes();
export default router;