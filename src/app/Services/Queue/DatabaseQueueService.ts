/*
 * @Author: trexwb
 * @Date: 2026-04-17
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/app/Services/Queue/DatabaseQueueService.ts
 * @Description:
 * 数据库队列服务 — 轻量化任务入队（供 Job.dispatch() 调用）
 * 框架版：队列写入由 queue.store 注入，不依赖业务 Model
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { Container } from '#app/Foundation/Container'
import type { DispatchOptions } from '#types/jobs'
import type { QueueStore } from '#types/framework'
import { createLogger } from '#utils/logger'

const log = createLogger('DatabaseQueueService')

export class DatabaseQueueService {
  /**
   * 将任务推入数据库队列
   *
   * @param className Job 类名（如 'SendSms'）
   * @param params    传给 Job 构造函数的参数
   * @param options   delay/queue 选项
   */
  static async dispatch(className: string, params: unknown, options: DispatchOptions = {}): Promise<unknown> {
    const { delay = 0, queue = 'default' } = options

    const store = Container.resolve<QueueStore>('queue.store')
    const job = await store.insertJob(className, params, { delay, queue })

    log.info({ jobId: job.id, className, queue, delay }, '任务已写入队列')
    return job
  }
}
