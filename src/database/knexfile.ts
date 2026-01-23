import 'dotenv/config'; // 简写，自动加载根目录 .env
import type { Knex } from 'knex';
import { config } from '#bootstrap/configLoader';

console.log('host:', config('database.host'));

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