/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:57:34
 * @FilePath: /node-laravel/src/config/cache.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
export default {
  driver: process.env.CACHE_DRIVER || 'file',
  host: process.env.CACHE_HOST || '127.0.0.1',
  port: process.env.CACHE_PORT || 6379,
  passwd: process.env.CACHE_PASSWORD || '',
  prefix: process.env.CACHE_PREFIX || 'cache_',
  path: process.env.CACHE_PATH || 'storage/cache',
  Database: process.env.CACHE_DATABASE || 'storage/db/cache.sqlite',
};