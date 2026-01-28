import { FileDriver } from '#app/Services/Cache/CacheFileDriver';
import { RedisDriver } from '#app/Services/Cache/CacheRedisDriver';
import { SqliteDriver } from '#app/Services/Cache/CacheSqliteDriver';
import type { CacheDriver } from '#app/Casts/CastInterface';
import { config } from '#bootstrap/configLoader';

export class CacheService {
  private static instance: CacheDriver;

  public static getDriver(): CacheDriver {
    if (this.instance) return this.instance;
    const driverType = config('cache.driver');
    switch (driverType) {
      case 'redis':
        this.instance = new RedisDriver();
        break;
      case 'sqlite':
        this.instance = new SqliteDriver();
        break;
      case 'file':
      default:
        this.instance = new FileDriver();
        break;
    }
    console.log(`[Cache] Using ${driverType} driver`);
    return this.instance;
  }

  // 快捷方法
  static async get(key: string) { return await this.getDriver().get(key); }
  static async set(key: string, value: any, ttl?: number) { return await this.getDriver().set(key, value, ttl); }
  static async forget(key: string) { return await this.getDriver().forget(key); }
  static async forgetByPattern(pattern: string) { return await this.getDriver().forgetByPattern(pattern); }
  static async remember(key: string, ttl: number = 0, callback: () => Promise<any>) {
    const val = await this.get(key);
    if (val !== null) return val;
    const freshData = await callback();
    // 如果 ttl 为 0，调用我们各驱动中约定的“永久”逻辑或给一个超长有效期
    const expire = ttl === 0 ? 315360000 : ttl;
    await this.set(key, freshData, expire);
    return freshData;
  }
  static async flush() { return await this.getDriver().flush(); }
}