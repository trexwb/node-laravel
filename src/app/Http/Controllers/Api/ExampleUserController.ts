/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/app/Http/Controllers/Api/ExampleUserController.ts
 * @Description:
 * API 控制器示例 — 演示如何接入 /api 网关路由
 *
 * 【使用方式】照葫芦画瓢：
 * 1. 与 Web 控制器不同，API 控制器默认继承 /api 下的统一网关中间件链
 *    （throttle → authenticateSecret → verifySignature → decryptRequest → encryptResponse）。
 *    业务方需先通过 Container 注册 auth.secretProvider 等依赖，网关才会放行（见 AuthenticateSecret）。
 * 2. 演示 Container 依赖注入：从容器解析 ExampleUserService，体现"框架层不依赖业务实现"。
 * 3. 演示中间件注入的请求上下文：req.id（TraceId 注入）、req.currentUser（AuthenticateToken 注入）。
 * 4. 在 src/routes/api.ts 的 createApiRoutes() 中注册（见该文件"示例路由"段）：
 *      router.get('/example/users', ExampleUserController.index)
 *      router.get('/example/users/:id', ExampleUserController.show)
 *    真实业务请统一放在网关中间件链之后，以继承统一鉴权/加解密能力。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { Container } from '#app/Foundation/Container'
import { ExampleUserService } from '#app/Services/Example/ExampleUserService'
import type { NextFunction, Request, Response } from 'express'

export class ExampleUserController {
  /**
   * 用户分页列表（GET /api/example/users）
   * 演示：分页响应结构 + req.id 全链路追踪 + 服务注入 + req.currentUser 上下文
   */
  public static async index(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const service = Container.resolve<ExampleUserService>('example.userService', () => new ExampleUserService())
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10))
    const data = service.list(page, pageSize)
    res.success({
      requestId: req.id,
      currentUser: req.currentUser ? { id: req.currentUser.id, nickname: req.currentUser.nickname } : null,
      ...data,
    })
  }

  /**
   * 用户详情（GET /api/example/users/:id）
   * 演示：资源不存在时使用 res.error 返回标准错误结构
   */
  public static async show(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const service = Container.resolve<ExampleUserService>('example.userService', () => new ExampleUserService())
    const user = service.find(Number(req.params.id))
    if (!user) {
      res.error(404009002001, '用户不存在')
      return
    }
    res.success(user)
  }
}
