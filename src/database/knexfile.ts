/*
 * @Author: trexwb
 * @Date: 2026-01-21 13:48:24
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-25 17:05:06
 * @FilePath: node-laravel/src/database/knexfile.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import '#bootstrap/env';
import type { Knex } from 'knex';
import { config } from '#bootstrap/configLoader';

const dbConfig: Knex.Config = {
  client: 'mysql2',
  connection: {
    host: config('database.host'),
    user: config('database.user'),
    password: config('database.password'),
    database: config('database.database'),
    // ⚠️ 每个新连接显式设置 MySQL session 时区为北京时间
    // phpMyAdmin 自动做这件事所以正常；应用层必须显式设置
    // timezone:'+08:00' 让 MySQL 返回 TIMESTAMP 时做 +08:00 转换（相对于 UTC）
    timezone: '+08:00',
    // 让 mysql2 直接返回 MySQL 已按 session time_zone 转换后的时间字符串，
    // 避免 JS Date 在不同运行环境时区下再次发生隐式转换。
    dateStrings: true,
    // TCP keepalive：防止 FC 容器休眠后连接被服务端/中间设备静默关闭
    enableKeepAlive: true,
    keepAliveInitialDelay: 30000, // 30 秒后发送第一个 keepalive 探针
  },
  pool: {
    min: 2,
    max: 20,
    // 空闲连接 60 秒后回收（避免 MySQL wait_timeout 过期后连接失效）
    idleTimeoutMillis: 60000,
    // 创建新连接超时 10 秒
    createTimeoutMillis: 10000,
    // 获取连接超时 30 秒
    acquireTimeoutMillis: 30000,
    afterCreate: (
      conn: { query(sql: string, callback: (err: Error | null) => void): void },
      done: (err: Error | null, conn?: { query(sql: string, callback: (err: Error | null) => void): void }) => void,
    ) => {
      // 每个连接建立后立即设置 session 时区为北京时间
      conn.query(`SET time_zone = '+08:00'`, (err: Error | null) => {
        done(err, conn);
      });
    },
  },
  migrations: {
    tableName: `${config('database.prefix')}migrations`,
    directory: './migrations',
    extension: config('app.env') == 'development' ? 'ts' : 'js',
  },
  seeds: {
    directory: './seeds',
    extension: config('app.env') == 'development' ? 'ts' : 'js',
  },
};

export default dbConfig;
