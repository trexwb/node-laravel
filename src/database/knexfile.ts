import dotenv from 'dotenv';
import path from 'path';
import type { Knex } from 'knex';
// 加载 .env 环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });
import { config } from '../bootstrap/configLoader';

const dbConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'mysql2',
    connection: {
      host: config('database.host'),
      user: config('database.user'),
      password: config('database.password'),
      database: config('database.database'),
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
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
    },
    pool: { min: 2, max: 20 },
    migrations: { directory: './migrations' },
    seeds: { directory: './seeds' }
  }
};

export default dbConfig;