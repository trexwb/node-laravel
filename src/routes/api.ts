/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/routes/api.ts
 * @Description:
 * 对外 API 网关路由
 * 框架版：不加载业务动态路由（apis/ 目录归属业务方自行维护）；保留统一网关中间件链，
 * 业务方可将自身路由挂到本 router 上继承统一鉴权/加解密能力。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { authenticateSecret } from '#app/Http/Middleware/AuthenticateSecret'
import { encryptResponse } from '#app/Http/Middleware/EncryptResponse'
import { throttle } from '#app/Http/Middleware/Throttle'
import { verifySignature } from '#app/Http/Middleware/VerifySignature'
import { decryptRequest } from '#app/Http/Middleware/DecryptRequest'
import { ExampleUserController } from '#app/Http/Controllers/Api/ExampleUserController'
import { Router } from 'express'

export async function createApiRoutes(): Promise<Router> {
  const router = Router()

  // 签名在解密之前（2026-08-18 调整）：开启请求加密时，只对加密结果 { encryptedData } 验签，
  // 避免对过长明文逐字段签名（大字段内容已整体进入密文，由密文完整性保证）
  router.use('/', throttle(60, 1), [authenticateSecret, verifySignature, decryptRequest, encryptResponse])

  // ── 示例 API 控制器路由（演示：把业务控制器挂到统一网关下）────────────────
  // 说明：注册在统一中间件链之后，继承 throttle/authenticateSecret/verifySignature/decryptRequest/encryptResponse。
  // 业务方需先通过 Container 注册 auth.secretProvider 等依赖（未注册时网关返回 500，见 AuthenticateSecret）。
  // 参考实现：src/app/Http/Controllers/Api/ExampleUserController.ts
  router.get('/example/users', ExampleUserController.index)
  router.get('/example/users/:id', ExampleUserController.show)

  return router
}
