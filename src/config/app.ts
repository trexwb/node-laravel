/*
 * @Author: trexwb
 * @Date: 2026-02-05
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27
 * @FilePath: /node-laravel/src/config/app.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
export default {
  name: process.env.APP_NAME || 'NodeLaravel',
  env: process.env.APP_ENV || 'development',
  debugger: process.env.APP_DEBUG === 'true',
  timezone: process.env.TIME_ZONE || 'Asia/Shanghai',
  url: process.env.APP_URL || 'localhost',
  http_port: parseInt(process.env.HTTP_PORT || process.env.PORT || '80'),
  https_port: parseInt(process.env.HTTPS_PORT || '443'),
  upload_path: process.env.UPLOAD_PATH || 'storage/uploads',
  ws: {
    port: parseInt(process.env.WS_PORT || '8080'),
    path: process.env.WS_PATH || '/socket.io',
    enabled: process.env.WS_ENABLED === 'true',
    // 🔧 Cluster 模式下的 WebSocket 策略
    // standalone: 独立进程模式，WebSocket 服务单独启动（推荐，生产环境首选）
    // shared: 与 HTTP 共享端口，通过 sticky-session 分发（简单场景可用）
    mode: process.env.WS_MODE || (process.env.CLUSTER_ENABLED === 'true' ? 'standalone' : 'shared'),
  },
  ssl: {
    key: process.env.SSL_KEY_PATH || '../certs/server.key',
    cert: process.env.SSL_CERT_PATH || '../certs/server.crt',
    enabled: process.env.SSL_ENABLED === 'true'
  },
  front: {
    port: parseInt(process.env.FRONT_PORT || '3000'),
    host: process.env.FRONT_HOST || '0.0.0.0',
  },
  // 控制台（admin）前端服务地址，供 routes/console.ts 反向代理使用
  console: {
    port: parseInt(process.env.CONSOLE_PORT || '3000'),
    host: process.env.CONSOLE_HOST || '0.0.0.0',
  },
  cluster: {
    enabled: process.env.CLUSTER_ENABLED === 'true',
    workers: process.env.CLUSTER_WORKERS === 'auto' ? 'auto' : parseInt(process.env.CLUSTER_WORKERS || '1')
  },
  security: {
    verify_signature: process.env.VERIFY_SIGNATURE === 'true',
    request_encrypt: process.env.REQUEST_ENCRYPT === 'true',
    return_encrypt: process.env.RETURN_ENCRYPT === 'true',
    token_time: parseInt(process.env.TOKEN_TIME || '1800'),
    // 🔴 强制要求：app_key 和 app_iv 必须通过环境变量配置
    // 不再提供硬编码默认值，从未配置时框架将拒绝启动
    app_key: process.env.APP_KEY,
    app_iv: process.env.APP_IV,
  },
  // CORS 白名单配置
  cors: {
    origins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
      : ['*'],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'App-Id', 'App-Secret', 'X-Request-Id', 'X-Sign'],
  },
  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || (process.env.APP_ENV === 'production' ? 'info' : 'debug'),
  },
};
