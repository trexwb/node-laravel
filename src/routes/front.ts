import path from 'path';
import express, { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { config } from '#bootstrap/configLoader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const FRONT_PORT = config('app.front.port') || 3000;

// // 静态文件服务优化
const frontDistPath = path.resolve(__dirname, '../');
router.use('/storage', express.static(path.resolve(frontDistPath, './storage/uploads')));

if (FRONT_PORT == 'nuxt') {
  router.get('/{*splat}', (_req: Request, res: Response, _next: NextFunction) => {
    res.status(200).sendFile(path.resolve(frontDistPath, '.resources/view/index.html'));
  });
} else {
  // 如果是 Nuxt 服务，则使用代理中间件
  router.get('/{*splat}', createProxyMiddleware({
    target: `http://0.0.0.0:${FRONT_PORT}`, // Nuxt 服务运行的地址和端口
    changeOrigin: true,
    pathRewrite: {
      '^/': '',     // 重写路径，可根据需要调整
    }
  }));
}

export default router;