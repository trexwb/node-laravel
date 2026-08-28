/*
 * @Author: trexwb
 * @Date: 2026-03-22
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/app/Events/index.ts
 * @Description:
 * 事件总线统一入口 & 框架级事件监听注册
 * 框架版：仅导出框架级事件；业务事件由业务方自行声明并注册
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { registerAllListeners } from '#app/Listeners/index'
import { createLogger } from '#app/Helpers/logger'

const log = createLogger('Events')

// ─────────────────────────────────────────────
// 框架事件导出
// ─────────────────────────────────────────────
export { BaseEvent } from '#app/Events/BaseEvent'

// 系统模块
export { CacheInvalidated, ScheduleChanged, WriteLogs } from '#app/Events/System/index'
export type { CacheInvalidatedPayload, ScheduleChangedPayload, WriteLogsPayload } from '#app/Events/System/index'

/** 初始化所有事件监听（整个进程只执行一次，由 AppServiceProvider.boot 调用） */
export function registerAllEvents() {
  registerAllListeners()
  log.info('All event listeners registered.')
}
