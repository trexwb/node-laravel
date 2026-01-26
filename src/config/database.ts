export default {
  connection: process.env.DB_CONNECTION || 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'node_laravel',
  prefix: process.env.DB_PREFIX || '',
};