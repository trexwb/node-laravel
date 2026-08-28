/*
 * @Author: trexwb
 * @Date: 2026-02-06 14:18:20
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-16 10:16:00
 * @FilePath: node-laravel/src/routes/web.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import { HealthController } from '#app/Http/Controllers/Front/HealthController'
import { ExampleController } from '#app/Http/Controllers/Front/ExampleController'
import type { NextFunction, Request, Response } from 'express'
import express, { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'node:path'
import { fileURLToPath } from 'url'
// import { loadRpcClientsFromDB } from '#app/Services/Rpc/LoadRpcClients';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()
const WEB_PORT = config('app.web.front.port') || 3000
const WEB_HOST = config('app.web.front.host') || '0.0.0.0'

// 静态文件服务优化
const rootPath = path.resolve(__dirname, '../')
const frontDistPath = path.resolve(__dirname, '../../../front/dist')
const paymentDistPath = path.resolve(__dirname, '../../../payment/dist')
router.use('/storage', express.static(path.resolve(rootPath, './storage/uploads')))

// ── 健康检查（无鉴权、无签名、无加密，必须在业务路由之前注册）──────────────
router.get('/health', HealthController.healthCheck)

// ── 示例控制器路由（演示：控制器 → 路由接入）────────────────────────
// 注意：必须在本文件的 /{*splat} 通配代理之前注册，否则请求会被代理吞掉。
// 参考实现：src/app/Http/Controllers/Front/ExampleController.ts
router.get('/example', ExampleController.index)
router.get('/example/:id', ExampleController.show)
router.post('/example', ExampleController.store)

if (WEB_HOST !== 'file') {
  router.get(
    '/payment/{*splat}',
    createProxyMiddleware({
      target: `http://${WEB_HOST}:9093`, // payment 服务运行的地址和端口
      changeOrigin: true,
    })
  )
  // 如果是 Nuxt 服务，则使用代理中间件
  router.get(
    '/{*splat}',
    createProxyMiddleware({
      target: `http://${WEB_HOST}:${WEB_PORT}`, // Nuxt 服务运行的地址和端口
      changeOrigin: true,
    })
  )
} else {
  router.get('/payment/{*splat}', (_req: Request, res: Response, _next: NextFunction) => {
    res.status(200).sendFile(path.resolve(paymentDistPath, 'index.html'))
  })
  // 如果是build文件可以使用
  router.get('/{*splat}', (_req: Request, res: Response, _next: NextFunction) => {
    res.status(200).sendFile(path.resolve(frontDistPath, 'index.html'))
  })
}

// 静态文件服务放在最后，让 SPA fallback 优先匹配
router.use(
  '/',
  express.static(frontDistPath, {
    // 如果文件不存在，不返回 404，交给后续中间件处理
    fallthrough: true,
  })
)

export default router
