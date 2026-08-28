/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/types/jobs.d.ts
 * @Description:
 * 队列任务域类型声明 — 框架级队列信封与入队选项，业务 Job 数据由业务方自行定义。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
// ─── 数据库队列 ──────────────────────────────────────────────────────

/** 任务信封（与队列 store 的 payload 结构一致） */
export interface QueueEnvelope {
  className: string
  params: unknown
}

/** 入队选项 */
export interface DispatchOptions {
  /** 延迟秒数（0 = 立即执行） */
  delay?: number
  /** 队列名（默认 default） */
  queue?: string
}
