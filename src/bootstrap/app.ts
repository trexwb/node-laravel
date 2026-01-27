import express from 'express';
import cors from 'cors';
import { Model } from 'objection';
import knex from 'knex';
import knexConfig from '#database/knexfile';
import { eventBus } from '#bootstrap/events';
import multer from 'multer';
import { AppServiceProvider } from '#app/Providers/AppServiceProvider';
import { Handler } from '#app/Exceptions/Handler';
import apiRoutes from '#routes/api';
import consoleRoutes from '#routes/console';
import frontRoutes from '#routes/front';
import { forceHttps } from '#app/Http/Middleware/ForceHttps';
import { responseWrapper } from '#app/Http/Middleware/ResponseWrapper';
import { config } from '#bootstrap/configLoader';

// 1. 基础实例化
const db = knex(knexConfig[config('app.env') || 'development']);
const app = express();
app.set('trust proxy', true);
Model.knex(db);

/**
 * 核心引导函数
 * 确保异步任务（路由加载）按顺序完成
 */
export async function bootstrap(app: express.Application) {
  // 确保任何请求进来先检查协议
  const appConfig = config('app');
  if (appConfig?.ssl?.enabled && config('app.env') === 'production') {
    app.use(forceHttps);
  }
  // 基础中间件
  app.use(express.json());
  app.use(express.static('public'));
  app.use(express.urlencoded({ extended: true }));
  app.use(multer().none());
  app.use(cors());
  app.use((req, res, next) => {
    (req as any).eventEmitter = eventBus;
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });
  // 注册响应包装器
  app.use(responseWrapper);
  // 启动服务提供者 (初始化事件监听等)
  AppServiceProvider.boot();
  // 动态加载路由 (必须 await)
  app.use('/api', apiRoutes);
  app.use('/console', consoleRoutes);
  app.use('/', frontRoutes);
  // 注册异常处理器 (!!! 关键点：必须在路由之后)
  // 只有在上面的路由都没有匹配到，或者路由内部调用了 next(err) 时，才会流转到这里
  app.use(Handler.render);
  console.log('[Bootstrap] 全局异常处理器已就绪');
}

export const container = {
  app,
  db,
  events: eventBus,
  config
};