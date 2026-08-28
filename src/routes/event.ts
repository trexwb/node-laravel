/*
 * @Author: trexwb
 * @Date: 2026-03-11
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/routes/event.ts
 * @Description:
 * 第三方事件回调路由
 * 框架版：不加载业务动态路由（events/ 目录归属业务方自行维护）；仅保留基础限流。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { throttle } from '#app/Http/Middleware/Throttle'
import { Router } from 'express'

export async function createEventRoutes(): Promise<Router> {
  const router = Router()

  // 事件回调一般来自第三方平台，不携带本系统的 App-Id/App-Secret 签名与加密能力
  // 统一在 /event 下绕开默认网关中间件，仅做基础限流（阈值设高，避免误伤）
  router.use('/', throttle(600, 1))
  return router
}
