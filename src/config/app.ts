/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:57:29
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
  http_port: parseInt(process.env.HTTP_PORT || '80'),
  https_port: parseInt(process.env.HTTPS_PORT || '443'),
  upload_path: process.env.UPLOAD_PATH || 'storage/uploads',
  ws: {
    port: parseInt(process.env.WS_PORT || '8080'),
    path: process.env.WS_PATH || '/socket.io',
    enabled: process.env.WS_ENABLED === 'true'
  },
  ssl: {
    key: process.env.SSL_KEY_PATH || '../certs/server.key',
    cert: process.env.SSL_CERT_PATH || '../certs/server.crt',
    enabled: process.env.SSL_ENABLED === 'true'
  },
  front: {
    port: parseInt(process.env.FRONT_PORT || '3000'),
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
    app_key: process.env.APP_KEY || 'wGEysbhEzHDqZKn9zaYUZGhHyhyFnj4p', // 用于加解密的密钥
    app_iv: process.env.APP_IV || 'ZegB26Y7dCebPkXr' // 用于加解密的向量
  }
};