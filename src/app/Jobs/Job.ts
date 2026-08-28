/*
 * @Author: trexwb
 * @Date: 2026-01-29
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-17
 * @FilePath: node-laravel/src/app/Jobs/Job.ts
 * @Description:
 * Job 基类 — 将任务推送到数据库队列（jobs 表）
 *
 * 迁移说明：
 *   - 方法签名保持不变：Job.dispatch(params, delay?)
 *   - delay 参数单位为秒（与原数据库队列一致）
 *   - 子类无需任何修改，调用方无需任何修改
 *
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { DatabaseQueueService } from '#app/Services/Queue/DatabaseQueueService'

export abstract class Job {
  // 子类需实现具体的业务逻辑
  abstract handle(): Promise<void>

  /**
   * 将任务写入 jobs 表（数据库队列）
   *
   * @param params 传给 Job 构造函数的参数（与原来一致）
   * @param delay  延迟秒数（与原数据库队列行为一致）
   */
  public static async dispatch(params: unknown, delay: number = 0): Promise<void> {
    await DatabaseQueueService.dispatch(this.name, params, { delay })
  }
}
