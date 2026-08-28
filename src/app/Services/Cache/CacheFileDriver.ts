/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-05 17:34:31
 * @FilePath: /stl/server/src/app/Services/Cache/CacheFileDriver.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { CacheDriver } from '#app/Interfaces/CacheDriver'
import { config } from '#bootstrap/configLoader'
import type { CacheFileData } from '#types/cache'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** 文件缓存落盘结构 */

export class FileDriver implements CacheDriver {
  private cachePath = path.resolve(__dirname, '../../../', config('cache.path') || 'storage/cache')
  private prefix: string

  /**
   * 初始化文件缓存驱动，读取配置中的缓存前缀。
   */
  constructor() {
    this.prefix = config('cache.prefix') || ''
  }

  /**
   * 根据缓存键生成对应的文件路径（MD5 哈希命名）。
   * @param {string} key - 缓存键名（已含前缀，由调用方拼接）
   * @returns {string} 缓存文件的绝对路径
   */
  private getFilePath(key: string) {
    const hash = crypto.createHash('md5').update(key).digest('hex')
    return path.join(this.cachePath, hash)
  }

  /**
   * 从文件缓存中读取指定键的值。
   * 若文件不存在或已过期，返回 null 并自动删除过期文件。
   * @param {string} key - 缓存键名
   * @returns {Promise<unknown|null>} 缓存值，不存在或已过期返回 null
   */
  async get(key: string): Promise<unknown> {
    try {
      const data = JSON.parse(await fs.readFile(this.getFilePath(this.prefix + key), 'utf-8')) as CacheFileData
      if (Date.now() > data.expire) {
        await this.forget(this.prefix + key)
        return null
      }
      return data.value
    } catch {
      return null
    }
  }

  /**
   * 将值写入文件缓存。
   * @param {string} key - 缓存键名
   * @param {unknown} value - 要缓存的值（会被 JSON 序列化）
   * @param {number} [ttl=3600] - 过期时间（秒），默认 3600 秒
   * @returns {Promise<void>} 写入完成
   * @throws {Error} 当目录创建或文件写入失败时抛出
   */
  async set(key: string, value: unknown, ttl: number = 3600) {
    const data = { value, expire: Date.now() + ttl * 1000 }
    await fs.mkdir(this.cachePath, { recursive: true })
    await fs.writeFile(this.getFilePath(this.prefix + key), JSON.stringify(data))
  }

  /**
   * 删除指定键的缓存文件。
   * 与 get/set 一致：调用方传入不含 prefix 的 key，内部拼接 prefix 后计算哈希路径。
   * 文件不存在时静默忽略。
   * @param {string} key - 缓存键名（不含前缀）
   * @returns {Promise<void>} 删除完成
   */
  async forget(key: string) {
    try {
      await fs.unlink(this.getFilePath(this.prefix + key))
    } catch (err) {
      // 不再静默吞异常，记录失败原因
      console.error('[CacheFileDriver] forget failed:', key, err)
    }
  }

  /**
   * 清空所有缓存文件（递归删除缓存目录）。
   * @returns {Promise<void>} 清空完成
   * @throws {Error} 当目录删除失败时抛出
   */
  async flush() {
    await fs.rm(this.cachePath, { recursive: true, force: true })
  }

  /**
   * 按模式删除缓存文件。
   * 文件驱动通过 MD5 哈希存储，无法做 key 层级的模式匹配，
   * 故降级为清空整个缓存目录（与模式语义不完全等价，已在日志中注明）。
   * @param {string} pattern - 匹配模式（文件驱动无法精确匹配，清空全部缓存）
   * @returns {Promise<number>} 始终返回 1 表示清空操作执行成功（FileDriver 无法精确计数）
   */
  async forgetByPattern(pattern: string): Promise<number> {
    console.warn(
      `[CacheFileDriver] forgetByPattern: pattern=[${pattern}] — FileDriver cannot match by pattern, flushing entire cache directory.`
    )
    await this.flush()
    return 1
  }

  /**
   * 列出所有缓存键名。
   * 文件驱动通过 MD5 哈希存储文件名，无法还原原始 key，
   * 因此仅返回所有缓存文件名作为占位标识。
   * @param {number} [limit] - 最大返回数量（接口兼容，文件驱动通常 key 数量少可不严格限制）
   * @returns {Promise<string[]>} 缓存文件名列表
   */
  async keys(limit?: number): Promise<string[]> {
    try {
      const files = await fs.readdir(this.cachePath)
      const filtered = files.filter((f) => f !== '.' && f !== '..')
      return limit ? filtered.slice(0, limit) : filtered
    } catch {
      return []
    }
  }
}
