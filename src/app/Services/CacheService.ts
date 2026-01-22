import { FileDriver } from '#app/Casts/CastFileDriver';
import { RedisDriver } from '#app/Casts/CastRedisDriver';
import type { CacheDriver } from '#app/Casts/CastInterface';

export class CacheService {
  private static instance: CacheDriver;

  public static getDriver(): CacheDriver {
    if (this.instance) return this.instance;

    const driverType = process.env.CACHE_DRIVER || 'file';

    switch (driverType) {
      case 'redis':
        this.instance = new RedisDriver();
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
  static async set(key: string, value: any, ttl?: number) {
    return await this.getDriver().set(key, value, ttl);
  }
  static async remember(key: string, ttl: number, callback: () => Promise<any>) {
    const val = await this.get(key);
    if (val !== null) return val;

    const freshData = await callback();
    await this.set(key, freshData, ttl);
    return freshData;
  }
}