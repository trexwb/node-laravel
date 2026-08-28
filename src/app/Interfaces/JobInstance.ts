/*
 * @Author: trexwb
 * @Date: 2026-08-17
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-17
 * @FilePath: /stl-dev-server/server/src/app/Interfaces/JobInstance.ts
 * @Description: 队列任务行为契约 — 所有 Job 类必须实现 handle() 方法
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

/** 队列任务行为契约（SendEmail / SendSms / SendWelcomeEmail 均实现此契约） */
export interface JobInstance {
  handle(): Promise<void>
}

/** Job 构造器契约（各 Job 构造器参数类型不同，注册表统一按 unknown 参数登记） */
export type JobClass = new (params: unknown) => JobInstance
