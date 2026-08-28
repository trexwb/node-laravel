/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/bootstrap/schedule.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { Kernel } from '#app/Console/Kernel'
import { createLogger } from '#utils/logger'
import cluster from 'node:cluster'

const log = createLogger('Scheduler')

/**
 * 启动计划任务
 * 建议只在 Master 进程或特定的 Worker 进程启动，避免重复执行
 */
export function bootScheduling() {
  if (cluster.isPrimary) {
    Kernel.listen()
    Kernel.schedule()
    log.info('计划任务调度器已启动')
  }
}
