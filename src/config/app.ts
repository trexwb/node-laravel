export default {
  name: process.env.APP_NAME || 'NodeLaravel',
  env: process.env.APP_ENV || 'development',
  url: process.env.APP_URL || 'http://localhost:3000',
  http_port: parseInt(process.env.HTTP_PORT || '80'),
  https_port: parseInt(process.env.HTTPS_PORT || '443'),
  timezone: process.env.TIME_ZONE || 'Asia/Shanghai',
  ssl: {
    key: process.env.SSL_KEY_PATH || '../certs/server.key',
    cert: process.env.SSL_CERT_PATH || '../certs/server.crt',
    enabled: process.env.SSL_ENABLED === 'true'
  },
  cluster: {
    enabled: process.env.CLUSTER_ENABLED === 'true',
    workers: process.env.CLUSTER_WORKERS === 'auto' ? 'auto' : parseInt(process.env.CLUSTER_WORKERS || '1')
  },
  security: {
    request_encrypt: process.env.REQUEST_ENCRYPT === 'true',
    return_encrypt: process.env.RETURN_ENCRYPT === 'true',
    token_time: parseInt(process.env.TOKEN_TIME || '1800'),
    app_key: process.env.APP_KEY || 'wGEysbhEzHDqZKn9zaYUZGhHyhyFnj4p', // 用于加解密的密钥
    app_iv: process.env.APP_IV || 'ZegB26Y7dCebPkXr' // 用于加解密的向量
  }
};