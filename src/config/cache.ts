export default {
  driver: process.env.CACHE_DRIVER || 'file',
  host: process.env.CACHE_HOST || '127.0.0.1',
  port: process.env.CACHE_PORT || 6379,
};