/*
 * @Author: trexwb
 * @Date: 2026-01-21 10:47:25
 * @LastEditors: ${git_name}
 * @LastEditTime: 2026-04-01 18:22:25
 * @FilePath: /stl-dev-server/server/src/app/Events/System/WriteLogs.ts
 * @Description:
 * 系统日志事件 - 统一记录各类操作日志
 * 一花一世界，一叶如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { BaseEvent } from '#app/Events/BaseEvent'

// payload 类型收敛至 #types/events；action 为业务自定义操作标识，由业务方 LogSinkRegistry 按 action 路由
import type { WriteLogsPayload } from '#types/events'
export type { WriteLogsPayload } from '#types/events'

/**
 * 系统日志事件
 * 用于触发日志记录操作，由 WriteLogsListener 处理具体逻辑
 */
export class WriteLogs extends BaseEvent<WriteLogsPayload> {
  static readonly eventName = 'system.write_logs'

  static emit(payload: WriteLogsPayload) {
    new WriteLogs(payload).dispatch()
  }
}
