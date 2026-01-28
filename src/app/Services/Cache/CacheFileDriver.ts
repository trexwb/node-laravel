import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from '#bootstrap/configLoader';
import type { CacheDriver } from '#app/Casts/CastInterface';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FileDriver implements CacheDriver {
  private cachePath = path.resolve(__dirname, '../../../', config('cache.path') || 'storage/cache');
  private prefix: string;
  constructor() {
    this.prefix = config('cache.prefix') || '';
  }
  private getFilePath(key: string) {
    const hash = crypto.createHash('md5').update(this.prefix + key).digest('hex');
    return path.join(this.cachePath, hash);
  }
  async get(key: string) {
    try {
      const data = JSON.parse(await fs.readFile(this.getFilePath(this.prefix + key), 'utf-8'));
      if (Date.now() > data.expire) {
        await this.forget(this.prefix + key);
        return null;
      }
      return data.value;
    } catch { return null; }
  }
  async set(key: string, value: any, ttl: number = 3600) {
    const data = { value, expire: Date.now() + ttl * 1000 };
    await fs.mkdir(this.cachePath, { recursive: true });
    await fs.writeFile(this.getFilePath(this.prefix + key), JSON.stringify(data));
  }
  async forget(key: string) {
    try { await fs.unlink(this.getFilePath(this.prefix + key)); } catch { }
  }
  async flush() {
    await fs.rm(this.cachePath, { recursive: true, force: true });
  }
  async forgetByPattern(pattern: string) {
    console.log(`File mode cannot delete the specified [${pattern}] cache.`)
    await this.flush();
  }
}