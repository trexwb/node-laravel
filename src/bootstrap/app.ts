/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/bootstrap/app.ts
 * @Description:
 * 框架引导 — Express 应用装配
 * 框架版：已移除业务专属逻辑（支付宝/微信/OSS 回调 raw body 捕获等），
 * 业务方如需对原始请求体验签，可在自身扩展点自行实现。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { Handler } from '#app/Exceptions/Handler'
import { forceHttps } from '#app/Http/Middleware/ForceHttps'
import { responseWrapper } from '#app/Http/Middleware/ResponseWrapper'
import { traceIdMiddleware } from '#app/Http/Middleware/TraceId'
import { AppServiceProvider } from '#app/Providers/AppServiceProvider'
import { config, validateSecurityConfig } from '#bootstrap/configLoader'
import { eventBus } from '#bootstrap/events'
import knexConfig from '#database/knexfile'
import { createApiRoutes } from '#routes/api'
import consoleRoutes from '#routes/console'
import { createEventRoutes } from '#routes/event'
import webRoutes from '#routes/web'
import { createLogger } from '#app/Helpers/logger'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import knex from 'knex'
import { Model } from 'objection'

const log = createLogger('Bootstrap')

// 1. 基础实例化
const db = knex(knexConfig)
const app = express()
// 只信任一跳代理（前置 Nginx），
// 防止直连客户端伪造 X-Forwarded-For 绕过基于 IP 的限流（登录爆破/短信轰炸防护）
app.set('trust proxy', 1)
Model.knex(db)

/**
 * 核心引导函数
 * 确保异步任务（路由加载）按顺序完成
 */
export async function bootstrap(appInstance: express.Application) {
  // 启动服务提供者 (初始化事件监听等)
  AppServiceProvider.boot()

  // APP_KEY / APP_IV 启动校验：生产环境强制要求配置（接线 validateSecurityConfig，杜绝静默降级）
  const appConfig = config('app')
  const appKey = appConfig?.security?.app_key
  const appIv = appConfig?.security?.app_iv
  if (appConfig.env === 'production') {
    validateSecurityConfig()
  } else if (!appKey || !appIv) {
    console.warn('[Bootstrap] APP_KEY/APP_IV not configured — encryption features will not work properly')
  }

  // 确保任何请求进来先检查协议
  if (appConfig.env === 'production') {
    appConfig?.ssl?.enabled && appInstance.use(forceHttps)
  }
  // Helmet 无条件启用（安全头保护）
  appInstance.use(helmet())
  // 基础中间件
  appInstance.use(express.json({ limit: '10mb' }))
  appInstance.use(express.static('public'))
  appInstance.use(express.urlencoded({ limit: '10mb', extended: true }))

  // 🌐 统一 CORS 配置
  const corsOrigins = config('app.cors.origins') || ['*']
  // 生产环境 CORS 全开放仅告警不阻断（存量部署兼容），建议显式配置白名单
  if (appConfig.env === 'production' && corsOrigins.includes('*')) {
    console.warn('[Bootstrap] CORS origins is "*" in production — 建议配置 CORS_ORIGINS 白名单')
  }
  const corsMethods = config('app.cors.methods') || ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH']
  const corsAllowedHeaders = config('app.cors.allowedHeaders') || ['Content-Type']
  appInstance.use(
    cors({
      origin: corsOrigins.includes('*') ? true : corsOrigins,
      methods: corsMethods,
      allowedHeaders: corsAllowedHeaders,
      credentials: !corsOrigins.includes('*'),
    })
  )

  appInstance.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.sendStatus(204)
    } else {
      req.eventEmitter = eventBus
      next()
    }
  })
  // 注册 TraceId 中间件（在 responseWrapper 之前，确保请求上下文在整个链路可用）
  appInstance.use(traceIdMiddleware)
  // 注册响应包装器
  appInstance.use(responseWrapper)
  // 加载路由 (必须 await，确保启动阶段一次性完成)
  const [apiRoutes, eventRoutes] = await Promise.all([createApiRoutes(), createEventRoutes()])
  // 注意：/api 前缀天然覆盖 /api/v1，禁止将同一 router 重复挂载到 /api 与 /api/v1，
  // 否则 /api/v1/* 请求会把整条中间件链执行两遍（限流翻倍、验签/解密二次执行导致签名必失败）。
  appInstance.use('/api', apiRoutes)
  appInstance.use('/event', eventRoutes)
  appInstance.use('/console', consoleRoutes)
  appInstance.use('/', webRoutes)
  // 注册异常处理器 (!!! 关键点：必须在路由之后)
  // 只有在上面的路由都没有匹配到，或者路由内部调用了 next(err) 时，才会流转到这里
  appInstance.use(Handler.render)
  log.info('全局异常处理器已就绪')
}

export const container = {
  app,
  db,
  events: eventBus,
  config,
}
