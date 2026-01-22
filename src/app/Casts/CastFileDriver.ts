import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from '#bootstrap/configLoader';
import type { CacheDriver } from '#app/Casts/CastInterface';

export class FileDriver implements CacheDriver {
  private cachePath = path.resolve(config('cache.path') || 'storage/framework/cache');

  private getFilePath(key: string) {
    const hash = crypto.createHash('md5').update(key).digest('hex');
    return path.join(this.cachePath, hash);
  }

  async get(key: string) {
    try {
      const data = JSON.parse(await fs.readFile(this.getFilePath(key), 'utf-8'));
      if (Date.now() > data.expire) {
        await this.forget(key);
        return null;
      }
      return data.value;
    } catch { return null; }
  }

  async set(key: string, value: any, ttl: number = 3600) {
    const data = { value, expire: Date.now() + ttl * 1000 };
    await fs.mkdir(this.cachePath, { recursive: true });
    await fs.writeFile(this.getFilePath(key), JSON.stringify(data));
  }

  async forget(key: string) {
    try { await fs.unlink(this.getFilePath(key)); } catch { }
  }

  async flush() {
    await fs.rm(this.cachePath, { recursive: true, force: true });
  }
}