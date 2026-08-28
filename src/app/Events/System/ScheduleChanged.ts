/*
 * @Author: trexwb
 * @Date: 2026-08-13
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-13
 * @FilePath: node-laravel/src/app/Events/System/ScheduleChanged.ts
 * @Description:
 * 调度变更事件
 * 【订阅者】
 *   1. Console/Kernel — 收到变更后重新加载调度器（替代 30s 轮询）
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { BaseEvent } from '#app/Events/BaseEvent'
import type { ScheduleChangedPayload } from '#types/events'
export type { ScheduleChangedPayload }


export class ScheduleChanged extends BaseEvent<ScheduleChangedPayload> {
  static readonly eventName = 'system.schedule_changed'

  static emit(payload: ScheduleChangedPayload) {
    new ScheduleChanged(payload).dispatch()
  }
}
