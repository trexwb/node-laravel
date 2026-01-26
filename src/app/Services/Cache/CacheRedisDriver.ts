import type { RedisClientType } from 'redis';
import { createClient } from 'redis';
import { config } from '#bootstrap/configLoader';
import type { CacheDriver } from '#app/Casts/CastInterface';

export class RedisDriver implements CacheDriver {
  private client: RedisClientType;
  private prefix: string;

  constructor() {
    const host = config('cache.host');
    const port = config('cache.port');
    const password = config('cache.passwd');
    this.prefix = config('cache.prefix') || '';

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
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    // 连接
    this.client.connect().catch((err) => {
      console.error('Failed to connect to Redis:', err);
    });
  }

  async get(key: string) {
    // 自动处理前缀（建议在 Driver 层处理，保持外部 Key 简洁）
    const val = await this.client.get(this.prefix + key);

    if (!val) return null;

    try {
      return JSON.parse(val);
    } catch {
      return val; // 如果不是 JSON 字符串，则返回原值
    }
  }

  async set(key: string, value: any, ttl: number = 3600) {
    const val = typeof value === 'object' ? JSON.stringify(value) : String(value);

    await this.client.set(this.prefix + key, val, {
      EX: ttl,
    });
  }

  async forget(key: string) {
    await this.client.del(this.prefix + key);
  }

  async flush() {
    // 注意：flushDb 会清空整个数据库，忽略前缀
    await this.client.flushDb();
  }

  async forgetByPattern(pattern: string) {
    const match = `${this.prefix}${pattern}*`;
    // 使用 scanIterator 迭代匹配的 key
    for await (const key of this.client.scanIterator({ MATCH: match })) {
      await this.client.del(key);
    }
  }

  async disconnect() {
    await this.client.quit();
  }
}