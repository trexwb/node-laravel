export default {
  driver: process.env.CACHE_DRIVER || 'file',
  host: process.env.CACHE_HOST || '127.0.0.1',
  port: process.env.CACHE_PORT || 6379,
  passwd: process.env.CACHE_PASSWORD || '',
  prefix: process.env.CACHE_PREFIX || 'cache_',
  path: process.env.CACHE_PATH || 'storage/cache',
  Database: process.env.CACHE_DATABASE || 'storage/db/cache.sqlite',
};