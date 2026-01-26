import sqlite3 from 'sqlite3';
import { config } from '#bootstrap/configLoader';
import path from 'node:path';
import fs from 'node:fs';
import type { CacheDriver } from '#app/Casts/CastInterface';

export class SqliteDriver implements CacheDriver {
  private db: sqlite3.Database;
  private prefix: string;

  constructor() {
    this.prefix = config('cache.prefix') || '';

    // 获取缓存文件路径 (例如 storage/cache/cache.sqlite)
    const cacheDir = path.resolve(config('cache.path') || 'storage/cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const dbPath = path.join(cacheDir, 'cache.sqlite');
    this.db = new sqlite3.Database(dbPath);

    // 初始化缓存表
    this.initTable();
  }

  private initTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT,
        expire_at INTEGER
      )
    `;
    this.db.run(sql, (err) => {
      if (err) console.error('[SqliteCache] Init error:', err);
      // 定期清理过期数据的任务 (每小时执行一次)
      setInterval(() => this.clearExpired(), 3600 * 1000);
    });
  }

  async get(key: string) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT value, expire_at FROM cache WHERE key = ?`;
      this.db.get(sql, [this.prefix + key], (err, row: any) => {
        if (err) return reject(err);
        if (!row) return resolve(null);

        // 检查是否过期
        if (Date.now() > row.expire_at) {
          this.forget(key);
          return resolve(null);
        }

        try {
          resolve(JSON.parse(row.value));
        } catch {
          resolve(row.value);
        }
      });
    });
  }

  async set(key: string, value: any, ttl: number = 3600) {
    return new Promise<void>((resolve, reject) => {
      const sql = `REPLACE INTO cache (key, value, expire_at) VALUES (?, ?, ?)`;
      const expireAt = Date.now() + ttl * 1000;
      const val = typeof value === 'object' ? JSON.stringify(value) : String(value);

      this.db.run(sql, [this.prefix + key, val, expireAt], (err) => {
        if (err) return reject(err);
        resolve(void 0);
      });
    });
  }

  async forget(key: string) {
    return new Promise<void>((resolve, reject) => {
      const sql = `DELETE FROM cache WHERE key = ?`;
      this.db.run(sql, [this.prefix + key], (err) => {
        if (err) return reject(err);
        resolve(void 0);
      });
    });
  }

  async flush() {
    return new Promise<void>((resolve, reject) => {
      const sql = `DELETE FROM cache`;
      this.db.run(sql, (err) => {
        if (err) return reject(err);
        resolve(void 0);
      });
    });
  }

  async forgetByPattern(pattern: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const sql = `DELETE FROM cache WHERE key LIKE ?`;
      // % 是 SQLite 的通配符
      this.db.run(sql, [`${this.prefix}${pattern}%`], (err) => {
        if (err) return reject(err);
        resolve(void 0);
      });
    });
  }

  private clearExpired() {
    const sql = `DELETE FROM cache WHERE expire_at < ?`;
    this.db.run(sql, [Date.now()]);
  }
}