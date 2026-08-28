/*
 * @Author: trexwb
 * @Date: 2026-01-29
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-12
 * @FilePath: node-laravel/src/app/Services/Cache/CacheService.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { CacheDriver } from '#app/Interfaces/CacheDriver'
import { FileDriver } from '#app/Services/Cache/CacheFileDriver'
import { RedisDriver } from '#app/Services/Cache/CacheRedisDriver'
import { config } from '#bootstrap/configLoader'

export class CacheService {
  private static instance: CacheDriver

  /**
   * 获取缓存驱动实例
   * 根据配置文件自动选择对应的缓存驱动（redis/file）
   * @returns {CacheDriver} 缓存驱动实例
   */
  public static getDriver(): CacheDriver {
    if (this.instance) return this.instance
    const driverType = config<string>('cache.driver')
    switch (driverType) {
      case 'redis':
        this.instance = new RedisDriver()
        break
      case 'file':
      default:
        this.instance = new FileDriver()
        break
    }
    console.log(`[Cache] Using ${driverType} driver`)
    return this.instance
  }

  /**
   * 从缓存中获取数据
   * @param {string} key - 缓存键名
   * @returns {Promise<unknown>} 缓存值，不存在时返回 null
   * @throws {Error} 当缓存驱动发生错误时抛出
   */
  static async get(key: string): Promise<unknown> {
    return await this.getDriver().get(key)
  }

  /**
   * 向缓存中设置数据
   * @param {string} key - 缓存键名
   * @param {unknown} value - 要存储的值
   * @param {number} [ttl] - 过期时间（秒），可选，不传则使用驱动默认值
   * @returns {Promise<void>} 写入完成
   * @throws {Error} 当缓存驱动发生错误时抛出
   */
  static async set(key: string, value: unknown, ttl?: number) {
    return await this.getDriver().set(key, value, ttl)
  }

  /**
   * 从缓存中删除指定键
   * @param {string} key - 缓存键名
   * @returns {Promise<boolean>} 删除成功返回 true，键不存在返回 false
   * @throws {Error} 当缓存驱动发生错误时抛出
   */
  static async forget(key: string) {
    return await this.getDriver().forget(key)
  }

  /**
   * 根据模式匹配删除缓存键（支持通配符）
   * @param {string} pattern - 匹配模式，如 "user:*"
   * @returns {Promise<number>} 删除的键数量
   * @throws {Error} 当缓存驱动不支持模式匹配或发生错误时抛出
   */
  static async forgetByPattern(pattern: string): Promise<number> {
    return await this.getDriver().forgetByPattern(pattern)
  }

  /**
   * 记住缓存：如果键存在则返回缓存值，否则执行回调并缓存结果
   * 包含互斥锁防护：缓存未命中时只允许一个请求执行回调，其他请求短轮询等待缓存写入
   * @param {string} key - 缓存键名
   * @param {number} [ttl=0] - 过期时间（秒），0 表示永久缓存（实际设置为超长有效期）
   * @param {() => Promise<T>} callback - 数据获取回调函数，仅在缓存未命中时执行
   * @returns {Promise<T>} 缓存值或回调执行结果
   * @throws {Error} 当回调执行失败或缓存操作失败时抛出
   */
  static async remember<T>(key: string, ttl: number = 0, callback: () => Promise<T>): Promise<T> {
    const val = await this.get(key)
    if (val !== null) return val as T

    // 互斥锁：尝试获取锁，防止缓存击穿（stampede）
    const lockKey = `lock:${key}`
    const lockTtl = 30 // 锁最多持有 30 秒，防止持锁进程崩溃后死锁
    let lockAcquired = false
    try {
      // 检查锁是否已存在（set 返回 void，需先 get 判断）
      const existingLock = await this.get(lockKey)
      if (existingLock === null) {
        await this.set(lockKey, '1', lockTtl)
        lockAcquired = true
      }
    } catch {
      // 锁操作失败时降级为无锁模式
    }
    if (!lockAcquired) {
      // 未获取到锁：短轮询等待其他请求写入缓存（最多等 10 秒）
      for (let i = 0; i < 20; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const waitingVal = await this.get(key)
        if (waitingVal !== null) return waitingVal as T
      }
      // 等待超时：直接执行回调作为降级（避免请求无限阻塞）
      console.warn(`[CacheService] Lock wait timeout for key: ${key}, executing callback as fallback`)
    }

    try {
      const freshData = await callback()
      if (freshData !== null && freshData !== undefined && freshData) {
        // 如果 ttl 为 0，调用我们各驱动中约定的"永久"逻辑或给一个超长有效期
        const expire = ttl === 0 ? 315360000 : ttl
        await this.set(key, freshData, expire)
      }
      return freshData
    } finally {
      // 释放锁
      await this.forget(lockKey)
    }
  }

  /**
   * 获取所有缓存键名列表。
   * @param {number} [limit] - 最大遍历数量，防止生产环境百万级 key 导致 OOM
   * @returns {Promise<string[]>} 缓存键名列表
   */
  static async keys(limit?: number) {
    return await this.getDriver().keys(limit)
  }

  /**
   * 清空所有缓存数据
   * @returns {Promise<boolean>} 清空成功返回 true，失败返回 false
   * @throws {Error} 当缓存驱动发生错误时抛出
   */
  static async flush() {
    return await this.getDriver().flush()
  }

  /**
   * 按模式安全删除缓存（防御性包装）。
   * 即使 Redis/缓存驱动故障也不会向上抛出异常，保证主业务不受影响。
   * 失败时打印错误日志但不中断流程。
   * @param {string} pattern - 匹配模式
   * @returns {Promise<number>} 删除的 key 数量；异常时返回 -1
   */
  static async safeFlush(pattern: string): Promise<number> {
    try {
      return await this.forgetByPattern(pattern)
    } catch (err) {
      console.error(`[CacheService] safeFlush failed (pattern=${pattern}):`, err)
      return -1
    }
  }
}
