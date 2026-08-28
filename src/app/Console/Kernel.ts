/*
 * @Author: trexwb
 * @Date: 2026-01-21
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/app/Console/Kernel.ts
 * @Description:
 * 调度内核
 * 框架版：任务数据与执行逻辑分别由 schedule.taskRepository / schedule.taskExecutor 注入，不依赖业务 Service
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { Container } from '#app/Foundation/Container'
import { ScheduleChanged } from '#app/Events/System/ScheduleChanged'
import { eventBus } from '#bootstrap/events'
import Utils from '#app/Helpers/index'
import { createLogger } from '#app/Helpers/logger'
import type { TaskExecutor, TaskRepository } from '#types/framework'
import schedule from 'node-schedule'

const log = createLogger('Kernel')

export class Kernel {
  static taskJobs = new Map<string, { job: schedule.Job; time: string }>()
  static isInitializing = false
  static isListening = false
  private static _reloadTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * 订阅调度变更事件（事件驱动，替代 30 秒轮询）。
   * 由 bootScheduling 在启动调度器时调用一次，避免重复注册。
   */
  public static listen() {
    if (this.isListening) return
    this.isListening = true
    eventBus.on(ScheduleChanged.eventName, () => this.requestReload())
  }

  /**
   * 防抖重载：合并短时间内的多次调度变更，避免频繁全量重建。
   */
  private static requestReload() {
    if (this._reloadTimer) clearTimeout(this._reloadTimer)
    this._reloadTimer = setTimeout(() => {
      this._reloadTimer = null
      void this.schedule()
    }, 300)
  }

  /**
   * 定义应用的计划任务
   */
  public static async schedule() {
    if (this.isInitializing) return
    this.isInitializing = true
    try {
      // 业务方通过 Container 注入任务数据源与执行器
      const taskRepository = Container.resolve<TaskRepository>('schedule.taskRepository', () => async () => [])
      const taskExecutor = Container.resolve<TaskExecutor>('schedule.taskExecutor', () => async () => {})
      const taskData = (await taskRepository()) || []
      const activeIds = new Set<string>()
      if (Array.isArray(taskData)) {
        for (const row of taskData) {
          const id = String(row.id)
          if (row.status !== 1 || !Utils.isValidCronFormatFlexible(row.time)) {
            continue
          }
          activeIds.add(id)
          const existing = this.taskJobs.get(id)
          // 如果 Cron 表达式变了，或者任务还没创建
          if (!existing || existing.time !== row.time) {
            if (existing) {
              existing.job.cancel()
              log.info({ taskId: id }, '任务配置变更，重启中')
            }
            // 创建新的调度
            const newJob = schedule.scheduleJob(row.time, async () => {
              await taskExecutor(row)
            })
            if (newJob) {
              this.taskJobs.set(id, { job: newJob, time: row.time })
            }
          }
        }
      }
      // 自动清理：删除那些不在数据库 active 列表中的任务
      for (const [id, { job }] of this.taskJobs.entries()) {
        if (!activeIds.has(id)) {
          job.cancel()
          this.taskJobs.delete(id)
          log.info({ taskId: id }, '任务已停用/删除，释放资源')
        }
      }
    } catch (err) {
      log.error({ err }, '调度器严重错误')
    } finally {
      this.isInitializing = false
      // 调度变更由 ScheduleChanged 事件驱动重载（见 listen / requestReload），不再轮询
    }
  }
}
