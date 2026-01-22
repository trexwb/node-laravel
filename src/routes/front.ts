/*** 
 * @Author: trexwb
 * @Date: 2024-02-01 11:31:39
 * @LastEditors: ${git_name}
 * @LastEditTime: 2025-09-15 14:28:11
 * @FilePath: /web/server/src/route/front/index.js
 * @Description: 
 * @一花一世界，一叶一如来
 * @Copyright (c) 2024 by 杭州大美, All Rights Reserved. 
 */
'use strict';
import path from 'path';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { Jobs } from '#app/Models/Jobs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const FRONT_PORT = process.env.FRONT_PORT || 3000;

// // 静态文件服务优化
const frontDistPath = path.resolve(__dirname, '../../../', './front/.output');
router.use(express.static(path.resolve(frontDistPath, 'public')));

router.use('/storage', express.static(path.join(__dirname, '../public/storage')));

router.get('/heartbeat', async (_req, res) => {
  const jobRecord = await Jobs.getNextAvailable();
  console.log('jobRecord:', jobRecord);
  res.success(jobRecord);
});

if (FRONT_PORT == 'nuxt') {
  router.get('/{*splat}', (_req, res) => {
    res.status(200).sendFile(path.resolve(frontDistPath, 'index.html'));
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