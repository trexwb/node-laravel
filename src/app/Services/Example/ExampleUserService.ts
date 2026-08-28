/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/app/Services/Example/ExampleUserService.ts
 * @Description:
 * 示例服务层 — 演示"瘦控制器、厚服务层"的分层模式
 *
 * 【使用方式】
 * 1. 服务层只承载纯业务逻辑，不直接接触 req/res，便于单元测试与跨端复用。
 * 2. 控制器通过 Container 解析本服务（参见 Front/ExampleController 与 Api/ExampleUserController）：
 *      const service = Container.resolve<ExampleUserService>('example.userService', () => new ExampleUserService())
 *    - 业务方可在启动期用 Container.bind / Container.singleton / Container.instance 显式注册，
 *      例如在 AppServiceProvider.boot() 中：
 *          Container.singleton('example.userService', () => new ExampleUserService())
 *    - 未注册时，resolve 的 fallback 参数会兜底返回新实例（与 HealthController 的 mockTokenProvider 用法一致）。
 * 3. 本例使用内存数组模拟数据源；实际业务请替换为 Objection / BaseModel 查询。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

/** 示例用户实体 */
export interface ExampleUser {
  id: number
  nickname: string
  email: string
  status: number
  createdAt: string
}

/** 分页查询结果（形状与 #types/helpers 的 FindManyResult 一致，兼容 EncryptResponse 的 Laravel 分页结构） */
export interface ExampleUserList {
  data: ExampleUser[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

/** 新建用户入参 */
export interface CreateExampleUserInput {
  nickname: string
  email: string
}

export class ExampleUserService {
  private users: ExampleUser[] = [
    { id: 1, nickname: '张三', email: 'zhangsan@example.com', status: 1, createdAt: '2026-08-01 10:00:00' },
    { id: 2, nickname: '李四', email: 'lisi@example.com', status: 1, createdAt: '2026-08-05 12:30:00' },
    { id: 3, nickname: '王五', email: 'wangwu@example.com', status: 0, createdAt: '2026-08-10 09:15:00' },
  ]
  private seq = 4

  /**
   * 分页查询用户列表
   * @param page 页码（从 1 开始）
   * @param pageSize 每页条数
   */
  public list(page = 1, pageSize = 10): ExampleUserList {
    const start = (page - 1) * pageSize
    const data = this.users.slice(start, start + pageSize)
    return {
      data,
      meta: {
        total: this.users.length,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(this.users.length / pageSize)),
      },
    }
  }

  /**
   * 按主键查询用户
   * @param id 用户主键
   * @returns 命中返回实体，未命中返回 null
   */
  public find(id: number): ExampleUser | null {
    return this.users.find((u) => u.id === id) || null
  }

  /**
   * 新建用户
   * @param input 新建入参
   */
  public create(input: CreateExampleUserInput): ExampleUser {
    const now = new Date()
    const user: ExampleUser = {
      id: this.seq++,
      nickname: input.nickname,
      email: input.email,
      status: 1,
      createdAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
    }
    this.users.push(user)
    return user
  }
}
