/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:59:22
 * @FilePath: /node-laravel/src/database/knexfile.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import 'dotenv/config'; // 简写，自动加载根目录 .env
import type { Knex } from 'knex';
import { config } from '#bootstrap/configLoader';

const dbConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'mysql2',
    connection: {
      host: config('database.host'),
      user: config('database.user'),
      password: config('database.password'),
      database: config('database.database'),
      timezone: '+08:00',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: `${config('database.prefix')}migrations`,
      directory: './migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './seeds',
      extension: 'ts',
    },
  },

  // 生产环境可以根据需要进行扩展
  production: {
    client: 'mysql2',
    connection: {
      host: config('database.host'),
      user: config('database.user'),
      password: config('database.password'),
      database: config('database.database'),
      timezone: '+08:00',
    },
    pool: { min: 2, max: 20 },
    migrations: { directory: './migrations' },
    seeds: { directory: './seeds' }
  }
};

export default dbConfig;