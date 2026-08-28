/*
 * @Author: trexwb
 * @Date: 2026-03-23 09:30:00
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-23 09:30:00
 * @FilePath: /stl/server/src/app/Listeners/System/CacheInvalidatedListener.ts
 * @Description:
 * 缓存失效监听器
 * 触发：任意 Service.flushallCache 后
 * 职责：记录缓存失效日志（可扩展为多节点广播）
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { eventBus } from '#bootstrap/events'
import type { CacheInvalidatedListenerPayload } from '#types/events'


export class CacheInvalidatedListener {
  static readonly EVENT = 'system.cache_invalidated'
  private static _listening = false

  static listen() {
    if (this._listening) return
    this._listening = true
    eventBus.on(this.EVENT, (payload: CacheInvalidatedListenerPayload) => {
      this.handle(payload).catch((err) => console.error('[CacheInvalidatedListener] handle error', err))
    })
  }

  static emit(payload: CacheInvalidatedListenerPayload) {
    eventBus.emit(this.EVENT, payload)
  }

  static async handle(payload: CacheInvalidatedListenerPayload) {
    // 记录缓存失效日志（可扩展为多节点广播）
    console.log(
      `[CacheInvalidated] module=${payload.module} pattern=${payload.pattern}` + (payload.triggeredBy ? ` by=${payload.triggeredBy}` : '')
    )
  }
}
