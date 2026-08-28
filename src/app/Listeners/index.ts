/*
 * @Author: trexwb
 * @Date: 2026-03-23 09:30:00
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/app/Listeners/index.ts
 * @Description:
 * 监听器统一注册入口
 * 框架版：仅注册框架级监听器；业务监听器由业务方自行注册
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

// ── 基础 ───────────────────────────────────────
export { BaseListener } from '#app/Listeners/BaseListener'

// ── 系统模块 ──────────────────────────────────
import { CacheInvalidatedListener } from '#app/Listeners/System/CacheInvalidatedListener'
import { WriteLogsListener } from '#app/Listeners/System/WriteLogsListener'

/**
 * 注册所有框架级监听器（整个进程只执行一次）
 * 调用位置：bootstrap/app.ts 或 bootstrap/events.ts
 */
export function registerAllListeners(): void {
  // 系统
  CacheInvalidatedListener.listen()
  WriteLogsListener.listen()

  console.log('[Listeners] All listeners registered.')
}

// 统一导出 Listener 类
export { CacheInvalidatedListener, WriteLogsListener }

// 统一导出 Payload 类型
export type { CacheInvalidatedPayload } from '#app/Events/System/index'
