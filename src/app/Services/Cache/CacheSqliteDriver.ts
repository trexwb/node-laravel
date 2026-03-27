/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/app/Services/Cache/CacheSqliteDriver.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 * 
 * ⚠️ Sqlite 驱动说明：
 * 适用于单进程环境（如开发、边缘计算节点）。
 * Cluster 模式或多进程环境下请使用 Redis 驱动。
 */
import sqlite3 from 'sqlite3';
import { config } from '#bootstrap/configLoader';
import path from 'node:path';
import fs from 'node:fs';
import type { CacheDriver } from '#app/Casts/CastInterface';
import { isProduction, config as loadConfig } from '#bootstrap/configLoader';

export class SqliteDriver implements CacheDriver {
  private db: sqlite3.Database;
  private prefix: string;
  private readonly DB_PATH: string;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // ⚠️ 生产 Cluster 模式警告
    if (isProduction() && loadConfig('app.cluster.enabled')) {
      console.warn(
        '[Cache/Sqlite] ⚠️ 检测到 Cluster 模式使用 SQLite 缓存！\n' +
        '  SQLite 不支持跨进程并发写入，多 Worker 会导致数据损坏或锁冲突。\n' +
        '  建议：在 .env 中设置 CACHE_DRIVER=redis'
      );
    }

    this.prefix = config('cache.prefix') || '';
    const cacheDir = path.resolve(config('cache.path') || 'storage/cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    this.DB_PATH = path.join(cacheDir, 'cache.sqlite');

    // 使用 WAL 模式提升并发性能
    this.db = new sqlite3.Database(this.DB_PATH);
    this.db.pragma('journal_mode = WAL');
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
    });

    // 定期清理过期数据（每小时）
    this.cleanupTimer = setInterval(() => this.clearExpired(), 3600 * 1000);
  }

  async get(key: string) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT value, expire_at FROM cache WHERE key = ?`;
      this.db.get(sql, [this.prefix + key], (err, row: any) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        if (Date.now() > row.expire_at) {
          this.forget(key).catch(() => {});
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
        resolve();
      });
    });
  }

  async forget(key: string) {
    return new Promise<void>((resolve, reject) => {
      const sql = `DELETE FROM cache WHERE key = ?`;
      this.db.run(sql, [this.prefix + key], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async flush() {
    return new Promise<void>((resolve, reject) => {
      const sql = `DELETE FROM cache`;
      this.db.run(sql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async forgetByPattern(pattern: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const sql = `DELETE FROM cache WHERE key LIKE ?`;
      this.db.run(sql, [`${this.prefix}${pattern}%`], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  private clearExpired() {
    this.db.run(`DELETE FROM cache WHERE expire_at < ?`, [Date.now()], (err) => {
      if (err) console.error('[SqliteCache] 清理过期数据失败:', err);
    });
  }

  /** 关闭数据库连接（应用退出时调用） */
  close() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.db.close((err) => {
      if (err) console.error('[SqliteCache] 关闭连接失败:', err);
    });
  }
}
