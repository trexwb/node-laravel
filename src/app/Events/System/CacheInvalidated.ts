/*
 * @Author: trexwb
 * @Date: 2026-03-30
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-30
 * @FilePath: node-laravel/src/app/Events/System/CacheInvalidated.ts
 * @Description:
 * 缓存失效事件
 * 【订阅者】
 *   1. 相关服务 — 清理本地缓存
 *   2. 集群其他节点 — 广播清理缓存
 * 一花一世界，一叶一同
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { BaseEvent } from '#app/Events/BaseEvent'
import type { CacheInvalidatedPayload } from '#types/events'
export type { CacheInvalidatedPayload }


export class CacheInvalidated extends BaseEvent<CacheInvalidatedPayload> {
  static readonly eventName = 'system.cache_invalidated'

  static emit(payload: CacheInvalidatedPayload) {
    new CacheInvalidated(payload).dispatch()
  }
}
