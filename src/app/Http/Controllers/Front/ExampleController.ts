/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/app/Http/Controllers/Front/ExampleController.ts
 * @Description:
 * Web 控制器示例 — 前台路由 /example
 *
 * 【使用方式】照葫芦画瓢：
 * 1. 控制器与 HealthController 保持一致：使用静态方法，一个方法对应一个路由动作。
 * 2. 响应统一用框架扩展的 res.success(data, msg) / res.error(code, msg)（实现见 ResponseWrapper）。
 * 3. 通过 Container.resolve 获取服务实例（未注册时 fallback 兜底）。
 * 4. 在 src/routes/web.ts 中注册（见该文件"示例路由"段）：
 *      router.get('/example', ExampleController.index)
 *      router.get('/example/:id', ExampleController.show)
 *      router.post('/example', ExampleController.store)
 *    注意：必须在 web.ts 的 /{*splat} 通配代理之前注册，否则请求会被代理吞掉。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { Container } from '#app/Foundation/Container'
import { getPagination } from '#app/Helpers/ControllerHelper'
import { ExampleUserService } from '#app/Services/Example/ExampleUserService'
import type { NextFunction, Request, Response } from 'express'

export class ExampleController {
  /**
   * 列表（GET /example）
   * 演示：query 分页参数 + 服务调用 + res.success 统一响应
   */
  public static async index(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const service = Container.resolve<ExampleUserService>('example.userService', () => new ExampleUserService())
    const { page, pageSize } = getPagination(req.query as Record<string, unknown>)
    res.success(service.list(page, pageSize))
  }

  /**
   * 详情（GET /example/:id）
   * 演示：路径参数 + 未命中时 res.error 兜底
   */
  public static async show(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const service = Container.resolve<ExampleUserService>('example.userService', () => new ExampleUserService())
    const id = Number(req.params.id)
    const user = service.find(id)
    if (!user) {
      res.error(404009001001, `用户不存在: id=${id}`)
      return
    }
    res.success(user)
  }

  /**
   * 新建（POST /example）
   * 演示：请求体读取 + 参数校验 + 服务写入 + 业务码 201
   */
  public static async store(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const service = Container.resolve<ExampleUserService>('example.userService', () => new ExampleUserService())
    const body = req.body as { nickname?: string; email?: string }
    if (!body.nickname || !body.email) {
      res.error(422009001002, 'nickname/email 不能为空')
      return
    }
    const user = service.create({ nickname: body.nickname, email: body.email })
    res.success(user, 201, 'created')
  }
}
