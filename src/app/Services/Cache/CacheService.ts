/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/app/Services/Cache/CacheService.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import { FileDriver } from '#app/Services/Cache/CacheFileDriver';
import { RedisDriver } from '#app/Services/Cache/CacheRedisDriver';
import { SqliteDriver } from '#app/Services/Cache/CacheSqliteDriver';
import type { CacheDriver } from '#app/Casts/CastInterface';
import { config } from '#bootstrap/configLoader';
import { isProduction } from '#bootstrap/configLoader';
import { logger } from '#utils/Logger';

export class CacheService {
  private static instance: CacheDriver | null = null;
  private static initialized = false;

  public static getDriver(): CacheDriver {
    if (this.instance) return this.instance;
    if (this.initialized) {
      throw new Error('[Cache] Driver 初始化失败，请检查配置');
    }
    this.initialized = true;

    const driverType = config('cache.driver') || 'file';

    // 🔴 Cluster 模式下强制要求 Redis，避免多进程文件缓存冲突
    if (isProduction() && config('app.cluster.enabled') && driverType !== 'redis') {
      logger.warn(
        `[Cache] Cluster 模式检测到使用 ${driverType} 驱动。` +
        `生产环境 Cluster 模式下建议使用 Redis 以避免多进程文件冲突，` +
        `已在 .env 中设置 CACHE_DRIVER=redis`
      );
    }

    switch (driverType) {
      case 'redis':
        this.instance = new RedisDriver();
        break;
      case 'sqlite':
        this.instance = new SqliteDriver();
        break;
      case 'file':
      default:
        // ⚠️ 非生产环境或单进程模式才允许 file 驱动
        if (isProduction() && config('app.cluster.enabled')) {
          logger.warn('[Cache] File 驱动在 Cluster 生产环境中可能不安全，已自动切换');
          this.instance = new FileDriver();
        } else {
          this.instance = new FileDriver();
        }
        break;
    }
    logger.info(`[Cache] Using ${driverType} driver`);
    return this.instance;
  }

  // 🔁 快捷方法
  static async get(key: string) { return await this.getDriver().get(key); }
  static async set(key: string, value: any, ttl?: number) { return await this.getDriver().set(key, value, ttl); }
  static async forget(key: string) { return await this.getDriver().forget(key); }
  static async forgetByPattern(pattern: string) { return await this.getDriver().forgetByPattern(pattern); }

  static async remember(key: string, ttl: number = 0, callback: () => Promise<any>) {
    const val = await this.get(key);
    if (val !== null) return val;
    const freshData = await callback();
    // 如果 ttl 为 0，使用超长有效期
    const expire = ttl === 0 ? 315360000 : ttl;
    await this.set(key, freshData, expire);
    return freshData;
  }

  static async flush() { return await this.getDriver().flush(); }

  /**
   * 重新初始化驱动（用于测试或配置变更后重载）
   */
  static reset(): void {
    this.instance = null;
    this.initialized = false;
  }
}
