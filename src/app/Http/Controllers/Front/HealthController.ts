/*
 * @Author: trexwb
 * @Date: 2026-08-13
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/app/Http/Controllers/Front/HealthController.ts
 * @Description:
 * 健康检查 Controller（含开发环境 Mock 接口）
 * 框架版：Mock Token 生成由业务方通过 Container 注册 dev.mockTokenProvider 注入，不依赖业务 Service
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { Container } from '#app/Foundation/Container'
import type { MockTokenProvider } from '#types/framework'
import type { NextFunction, Request, Response } from 'express'

export class HealthController {
  /**
   * 健康检查（GET，无鉴权，供负载均衡/监控探活）
   * 路由：GET /health
   */
  public static healthCheck(_req: Request, res: Response, _next: NextFunction): void {
    res.json({
      status: 'ok',
      pid: process.pid,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
    })
  }

  /**
   * 健康检查（POST，需鉴权，返回业务级成功状态）
   * 路由：POST /front/health/
   */
  public static async health(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    res.success()
  }

  /**
   * 回显请求体（仅开发环境暴露，挂载由路由层按环境控制）
   * 路由：POST /front/health/mockDate
   */
  public static async mockDate(req: Request, res: Response, _next: NextFunction): Promise<void> {
    res.success(req.body)
  }

  /**
   * 生成 Mock 登录 Token（仅开发环境暴露，挂载由路由层按环境控制）
   * 路由：POST /front/health/mockToken
   */
  public static async mockToken(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = Container.resolve<MockTokenProvider>('dev.mockTokenProvider', () => async () => null)
      res.success(await provider())
    } catch (error) {
      next(error)
    }
  }
}
