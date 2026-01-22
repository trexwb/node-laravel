import type { RedisClientType } from 'redis';
import { createClient } from 'redis';
import { container } from '#bootstrap/app';
import type { CacheDriver } from '#app/Casts/CastInterface';

export class RedisDriver implements CacheDriver {
  private client: RedisClientType;

  constructor() {
    const url = container.config('cache.host') + ':' + container.config('cache.port');
    this.client = createClient({ url });

    // 推荐：监听错误，避免未捕获异常导致进程退出
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    // 连接客户端
    this.client.connect().catch(console.error);
  }

  async get(key: string) {
    const val = await this.client.get(key);
    return val ? JSON.parse(val) : null;
  }

  async set(key: string, value: any, ttl: number = 3600) {
    await this.client.set(key, JSON.stringify(value), {
      EX: ttl, // 使用选项对象更清晰（也可用 'EX', ttl，但推荐对象）
    });
  }

  async forget(key: string) {
    await this.client.del(key);
  }

  async flush() {
    await this.client.flushDb();
  }

  // 可选：提供关闭连接的方法
  async disconnect() {
    await this.client.quit();
  }
}