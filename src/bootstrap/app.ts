/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 13:45:00
 * @FilePath: /node-laravel/src/bootstrap/app.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Model } from 'objection';
import knex from 'knex';
import multer from 'multer';
import { createServer as createHttpServer, type Server as HttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { readFileSync } from 'node:fs';
import { WebSocketServer } from 'ws';
import knexConfig from '#database/knexfile';
import { eventBus, createCrossProcessEventBus } from '#bootstrap/events';
import { AppServiceProvider } from '#app/Providers/AppServiceProvider';
import { Handler } from '#app/Exceptions/Handler';
import apiRoutes from '#routes/api';
import consoleRoutes from '#routes/console';
import frontRoutes from '#routes/front';
import { forceHttps } from '#app/Http/Middleware/ForceHttps';
import { responseWrapper } from '#app/Http/Middleware/ResponseWrapper';
import { requestId } from '#app/Http/Middleware/RequestId';
import { config, validateSecurityConfig } from '#bootstrap/configLoader';
import { logger } from '#utils/Logger';
import { bootScheduling } from '#bootstrap/schedule';
import { registerChannels } from '#routes/channels';

// 🔴 安全配置验证必须在任何业务逻辑之前执行
validateSecurityConfig();

// 1. 数据库初始化
const db = knex(knexConfig[config('app.env') || 'development']);
Model.knex(db);

// 2. Express 应用初始化
const app = express();
app.set('trust proxy', true);

/**
 * 核心引导函数
 */
export async function bootstrap(): Promise<HttpServer> {
  const appConfig = config('app');

  // 🔒 请求ID（所有中间件中最前面，确保日志可追踪）
  app.use(requestId);

  // 🔒 HTTPS 强制重定向（仅生产环境）
  if (appConfig?.ssl?.enabled && config('app.env') === 'production') {
    app.use(forceHttps);
  }

  // 🔒 Helmet 安全头（必须在路由之前）
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // 📋 基础中间件
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(express.static('public'));
  app.use(multer().none());

  // 🌐 统一 CORS 配置
  const corsOrigins = config('app.cors.origins') || ['*'];
  const corsMethods = config('app.cors.methods') || ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'];
  const corsAllowedHeaders = config('app.cors.allowedHeaders') || ['Content-Type'];
  app.use(cors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    methods: corsMethods,
    allowedHeaders: corsAllowedHeaders,
    credentials: !corsOrigins.includes('*'),
  }));

  // 📝 开发环境请求日志
  if (config('app.env') === 'development') {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.debug(`[${req.id}] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
      });
      next();
    });
  }

  // 事件总线注入
  app.use((req: any, _res, next) => {
    req.eventEmitter = eventBus;
    next();
  });

  // 注册响应包装器
  app.use(responseWrapper);

  // 启动服务提供者
  AppServiceProvider.boot();

  // 动态加载路由
  app.use('/api', apiRoutes);
  app.use('/console', consoleRoutes);
  app.use('/', frontRoutes);

  // 🏥 健康检查端点
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      pid: process.pid,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  // 全局异常处理器（必须放在路由之后）
  app.use(Handler.render);
  logger.info('[Bootstrap] 全局异常处理器已就绪');

  // ============================================================
  // HTTP/HTTPS 服务器
  // ============================================================
  const httpServer = createHttpServer(app);
  const httpPort = appConfig.http_port;
  httpServer.listen(httpPort, () => {
    logger.info(`[Worker ${process.pid}] 🔓 HTTP Server: http://${appConfig.url || 'localhost'}:${httpPort}`);
  });

  if (appConfig.ssl?.enabled) {
    try {
      const options = {
        key: readFileSync(appConfig.ssl.key),
        cert: readFileSync(appConfig.ssl.cert),
      };
      const httpsServer = createHttpsServer(options, app);
      const httpsPort = appConfig.https_port;
      httpsServer.listen(httpsPort, () => {
        logger.info(`[Worker ${process.pid}] 🔒 HTTPS Server: https://${appConfig.url || 'localhost'}:${httpsPort}`);
      });
    } catch (err) {
      logger.error('[SSL] 证书加载失败，HTTPS 未启动:', (err as Error).message);
    }
  }

  // ============================================================
  // WebSocket（非独立进程模式时挂载到 HTTP）
  // ============================================================
  if (appConfig.ws?.enabled && appConfig.ws.mode !== 'standalone') {
    try {
      const wss = new WebSocketServer({ server: httpServer });
      registerChannels(wss);
      // 初始化跨进程事件总线
      createCrossProcessEventBus({ channel: 'ws:broadcast' });
      logger.info('[WebSocket] 已挂载到 HTTP 服务器');
    } catch (err) {
      logger.error('[WebSocket] 启动失败:', (err as Error).message);
    }
  }

  // ============================================================
  // 启动定时任务调度器
  // ============================================================
  try {
    bootScheduling();
  } catch (err) {
    logger.error('[Schedule] 调度器启动失败:', (err as Error).message);
  }

  // ============================================================
  // 优雅关闭
  // ============================================================
  const gracefulShutdown = async (signal: string) => {
    logger.info(`[${signal}] 收到退出信号，正在优雅关闭...`);
    httpServer.close(async () => {
      logger.info('HTTP 服务器已关闭');
      try {
        await db.destroy();
        logger.info('数据库连接池已释放');
      } catch (e) {
        logger.error('数据库关闭时出错:', e);
      }
      process.exit(0);
    });
    setTimeout(() => {
      logger.warn('优雅关闭超时，强制退出');
      process.exit(1);
    }, 10000);
  };
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return httpServer;
}

export const container = {
  app,
  db,
  events: eventBus,
  config,
};
