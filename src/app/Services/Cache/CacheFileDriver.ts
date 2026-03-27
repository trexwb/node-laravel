/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/app/Services/Cache/CacheFileDriver.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 * 
 * ⚠️ File 驱动说明：
 * 适用于单进程开发/演示环境。
 * Cluster 模式或多进程环境下请使用 Redis 驱动。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from '#bootstrap/configLoader';
import type { CacheDriver } from '#app/Casts/CastInterface';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FileDriver implements CacheDriver {
  private cachePath: string;
  private prefix: string;

  constructor() {
    this.prefix = config('cache.prefix') || '';
    this.cachePath = path.resolve(__dirname, '../../../', config('cache.path') || 'storage/cache');
  }

  private getFilePath(key: string): string {
    const hash = crypto.createHash('md5').update(this.prefix + key).digest('hex');
    return path.join(this.cachePath, hash);
  }

  async get(key: string) {
    try {
      const filePath = this.getFilePath(key);
      const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      if (Date.now() > data.expire) {
        await this.forget(key).catch(() => {});
        return null;
      }
      return data.value;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 3600) {
    const data = { value, expire: Date.now() + ttl * 1000 };
    await fs.mkdir(this.cachePath, { recursive: true });
    await fs.writeFile(this.getFilePath(key), JSON.stringify(data), { encoding: 'utf-8' });
  }

  async forget(key: string) {
    try {
      await fs.unlink(this.getFilePath(key));
    } catch {
      // 文件不存在则忽略
    }
  }

  async flush() {
    await fs.rm(this.cachePath, { recursive: true, force: true });
  }

  async forgetByPattern(pattern: string) {
    // File 驱动无法高效实现通配符删除，直接 flush
    console.warn(`[Cache/File] forgetByPattern(${pattern}) 在文件模式下效率低，建议使用 Redis`);
    await this.flush();
  }
}
