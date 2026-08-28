/*
 * @Author: trexwb
 * @Date: 2026-01-21
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-02
 * @FilePath: node-laravel/src/routes/console.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import type { NextFunction, Request, Response } from 'express'
import express, { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'node:path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()
const WEB_PORT = config<number>('app.console.port') || 3000
const WEB_HOST = config<string>('app.console.host') || '0.0.0.0'

// 静态文件服务优化
const consoleDistPath = path.resolve(__dirname, '../../../console/dist')
if (WEB_HOST !== 'file') {
  // 如果是 Nuxt 服务，则使用代理中间件
  router.get(
    '/{*splat}',
    createProxyMiddleware({
      target: `http://${WEB_HOST}:${WEB_PORT}`, // Nuxt 服务运行的地址和端口
      changeOrigin: true,
      // 路径重写：添加 /console 前缀（因为 Express 路由已经去掉了 /console）
      pathRewrite: {
        '^/': '/console/',
      },
      // 代理 WebSocket（支持 HMR）
      ws: true,
    })
  )
} else {
  // 如果是 Nuxt 服务，则使用代理中间件
  router.get('/{*splat}', (_req: Request, res: Response, _next: NextFunction) => {
    res.status(200).sendFile(path.resolve(consoleDistPath, 'index.html'))
  })
}

// 静态文件服务放在最后，让 SPA fallback 优先匹配
router.use(
  '/',
  express.static(consoleDistPath, {
    // 如果文件不存在，不返回 404，交给后续中间件处理
    fallthrough: true,
  })
)

export default router
