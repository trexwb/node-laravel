/*
 * @Author: trexwb
 * @Date: 2026-01-29
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-16
 * @FilePath: node-laravel/src/app/Services/Cache/CacheRedisDriver.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { CacheDriver } from '#app/Interfaces/CacheDriver'
import { config } from '#bootstrap/configLoader'
import type { RedisClientType } from 'redis'
import { createClient } from 'redis'

export class RedisDriver implements CacheDriver {
  private client: RedisClientType
  private prefix: string
  private readyPromise: Promise<void>
  private connectError: Error | null = null

  /**
   * 初始化 Redis 缓存驱动，读取配置并建立连接。
   * 连接失败时保留错误（不吞错），由 ensureReady 快速失败抛出，而非无限轮询。
   */
  constructor() {
    const host = config<string>('cache.host')
    const port = config<number>('cache.port')
    const password = config<string>('cache.passwd')
    this.prefix = config<string>('cache.prefix') || ''
    /**
     * 构建 Redis 连接配置
     * 格式：redis[s]://[[username][:password]@][host][:port][/db-number]
     */
    // const auth = password ? `:${encodeURIComponent(password)}@` : '';
    // const url = `redis://${auth}${host}:${port}`;
    this.client = createClient({
      // url,
      // 如果你不想用 URL 格式，也可以这样写：
      password,
      socket: {
        host,
        port,
      },
    })
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })
    // 保存连接 Promise，确保操作前已就绪；连接失败保留错误，交由 ensureReady 快速失败
    this.readyPromise = this.client
      .connect()
      .then(() => {
        this.connectError = null
        console.log(`[CacheRedisDriver] Connected to Redis ${host}:${port}`)
      })
      .catch((err: unknown) => {
        this.connectError = err instanceof Error ? err : new Error(String(err))
      })
  }

  /**
   * 等待 Redis 连接就绪（供内部方法调用）。
   * 带超时快速失败：连接失败或超时均抛出异常，避免所有缓存操作永久挂起。
   */
  private async ensureReady() {
    const timeoutMs = config<number>('cache.connect_timeout', 3000)
    await Promise.race([
      this.readyPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Redis connection timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ])
    // 连接阶段已失败（如认证失败等不可恢复错误），直接抛出
    if (this.connectError) {
      throw this.connectError
    }
    if (!this.client.isReady) {
      throw new Error('Redis client is not ready')
    }
  }

  /**
   * 从 Redis 中读取指定键的值。
   * 自动处理前缀，并尝试 JSON 反序列化；非 JSON 字符串则原样返回。
   * @param {string} key - 缓存键名
   * @returns {Promise<unknown|null>} 缓存值，不存在返回 null
   * @throws {Error} 当 Redis 操作失败时抛出
   */
  async get(key: string): Promise<unknown> {
    await this.ensureReady()
    // 自动处理前缀（建议在 Driver 层处理，保持外部 Key 简洁）
    const val = await this.client.get(this.prefix + key)
    if (!val) return null
    try {
      return JSON.parse(val) as unknown
    } catch {
      return val // 如果不是 JSON 字符串，则返回原值
    }
  }

  /**
   * 向 Redis 写入缓存值，并设置过期时间。
   * 对象类型会自动 JSON 序列化。
   * @param {string} key - 缓存键名
   * @param {unknown} value - 要缓存的值
   * @param {number} [ttl=3600] - 过期时间（秒），默认 3600 秒
   * @returns {Promise<void>} 写入完成
   * @throws {Error} 当 Redis 操作失败时抛出
   */
  async set(key: string, value: unknown, ttl: number = 3600) {
    await this.ensureReady()
    const val = typeof value === 'object' ? JSON.stringify(value) : String(value)
    await this.client.set(this.prefix + key, val, {
      EX: ttl,
    })
  }

  /**
   * 仅当 key 不存在时写入（原子 SET NX），返回是否写入成功。
   * 用于互斥锁 / 防重放等需要原子 check-and-set 的场景（避免 check-then-set 竞态）。
   * @param {string} key - 缓存键名
   * @param {unknown} value - 要写入的值
   * @param {number} [ttl=3600] - 过期时间（秒）
   * @returns {Promise<boolean>} true 表示写入成功（此前不存在），false 表示 key 已存在
   */
  async add(key: string, value: unknown, ttl: number = 3600): Promise<boolean> {
    await this.ensureReady()
    const val = typeof value === 'object' ? JSON.stringify(value) : String(value)
    const result = await this.client.set(this.prefix + key, val, {
      EX: ttl,
      NX: true,
    })
    return result === 'OK'
  }

  /**
   * 删除 Redis 中指定键的缓存。
   * @param {string} key - 缓存键名
   * @returns {Promise<void>} 删除完成
   * @throws {Error} 当 Redis 操作失败时抛出
   */
  async forget(key: string) {
    await this.ensureReady()
    if (!key) return
    await this.client.del(this.prefix + key)
  }

  /**
   * 清空当前 Redis 数据库中的所有数据（flushDb）。
   * 注意：此操作会忽略前缀，清空整个数据库，请谨慎使用。
   * @returns {Promise<void>} 清空完成
   * @throws {Error} 当 Redis 操作失败时抛出
   */
  async flush() {
    await this.ensureReady()
    // 注意：flushDb 会清空整个数据库，忽略前缀
    await this.client.flushDb()
  }

  /**
   * 按模式批量删除 Redis 缓存键（使用 SCAN 迭代，避免阻塞）。
   * @param {string} pattern - 匹配模式（会自动拼接前缀和尾部通配符 `*`）
   * @returns {Promise<number>} 实际删除的 key 数量
   * @throws {Error} 当 Redis 操作失败时抛出
   */
  async forgetByPattern(pattern: string): Promise<number> {
    await this.ensureReady()
    const match = `${this.prefix}${pattern}*`
    // 使用 scanIterator 迭代匹配的 key；批量 del，避免出现 del 参数为空的边界情况
    const batch: string[] = []
    let totalScanned = 0
    let totalDeleted = 0

    const flush = async () => {
      if (batch.length === 0) return
      const keys = batch.splice(0, batch.length).filter(Boolean)
      if (keys.length === 0) return
      // SCAN 返回的 keys 已包含 prefix，直接传给 Redis del() 即可
      const deleted = await this.client.del(keys)
      totalDeleted += deleted
    }

    try {
      for await (const item of this.client.scanIterator({ MATCH: match })) {
        if (!item) continue
        // 兼容不同实现可能返回 string 或 string[]
        if (Array.isArray(item)) {
          for (const k of item)
            if (k) {
              batch.push(k)
              totalScanned++
            }
        } else {
          batch.push(item)
          totalScanned++
        }
        if (batch.length >= 500) await flush()
      }
      await flush()
    } catch (err) {
      console.error(`[CacheRedisDriver] forgetByPattern error (pattern: ${match}):`, err)
      throw err
    }
    // 统计日志降级为 debug：仅在调试模式输出，避免高频删除操作刷屏（P3 修复）
    if (config('app.debugger') === true) {
      console.debug(`[CacheRedisDriver] forgetByPattern: pattern=${match} scanned=${totalScanned} deleted=${totalDeleted}`)
    }
    return totalDeleted
  }

  /**
   * 列出所有缓存键名（使用 SCAN 迭代，避免阻塞）。
   * @param {number} [limit] - 最大遍历数量，达到后停止扫描（防止百万级 key OOM）
   * @returns {Promise<string[]>} 缓存键名列表（已含前缀）
   */
  async keys(limit?: number): Promise<string[]> {
    await this.ensureReady()
    const keys: string[] = []
    try {
      for await (const item of this.client.scanIterator({ MATCH: `${this.prefix}*`, COUNT: 200 })) {
        if (!item) continue
        if (Array.isArray(item)) {
          for (const k of item) if (k) keys.push(k)
        } else if (item) {
          keys.push(item)
        }
        if (limit && keys.length >= limit) break
      }
    } catch (err) {
      console.error('[CacheRedisDriver] keys() error:', err)
    }
    return keys
  }

  /**
   * 断开 Redis 连接（优雅退出）。
   * @returns {Promise<void>} 断开完成
   * @throws {Error} 当断开操作失败时抛出
   */
  async disconnect() {
    await this.ensureReady()
    await this.client.quit()
  }
}
