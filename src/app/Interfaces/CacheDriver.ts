/*
 * @Author: trexwb
 * @Date: 2026-01-22
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-17
 * @FilePath: node-laravel/src/app/Interfaces/CacheDriver.ts
 * @Description: 缓存驱动行为契约 — FileDriver / RedisDriver 均实现此契约
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

/** 缓存驱动行为契约（CacheService 通过此契约切换 file / redis 驱动） */
export interface CacheDriver {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown, ttl?: number): Promise<void> // ttl 单位：秒
  /** 仅当 key 不存在时写入（原子 SET NX），返回是否写入成功；用于互斥锁/防重放等 check-then-set 竞态场景 */
  add(key: string, value: unknown, ttl?: number): Promise<boolean>
  forget(key: string): Promise<void>
  flush(): Promise<void>
  forgetByPattern(pattern: string): Promise<number> // 返回删除的 key 数量
  keys(limit?: number): Promise<string[]> // 返回缓存键名列表（含前缀；limit 限制最大遍历数量防止 OOM）
}
