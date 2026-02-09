/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:59:36
 * @FilePath: /node-laravel/src/public/index.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import 'dotenv/config'; // 简写，自动加载根目录 .env
import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { readFileSync } from 'node:fs';
import { WebSocketServer } from 'ws';
import { container, bootstrap } from '#bootstrap/app';
import { bootScheduling } from '#bootstrap/schedule';
import { runWithCluster } from '#bootstrap/cluster';
import { registerChannels } from '#routes/channels';

runWithCluster(async () => {
  const { app } = container;
  const config = container.config('app'); // 假设你已经有了配置加载器
  await bootstrap(app);
  // --- 1. 创建 HTTP 服务器 ---
  const httpServer = createHttpServer(app);
  const httpPort = config.http_port;
  // --- 2. 创建 HTTPS 服务器 (如果启用) ---
  let httpsServer;
  if (config.ssl.enabled) {
    try {
      const options = {
        key: readFileSync(config.ssl.key),
        cert: readFileSync(config.ssl.cert),
      };
      httpsServer = createHttpsServer(options, app);
    } catch (err) {
      console.error('[SSL] 证书加载失败，HTTPS 未启动:', (err as Error).message);
    }
  }
  // --- 3. 初始化 WebSocket ---
  if (config.ws.enabled) {
    // WebSocket 可以挂载到 HTTP 上，也可以挂载到 HTTPS 上
    // 如果两个都想支持，可以创建两个 WSS 实例，或者共用逻辑
    try {
      const wss = new WebSocketServer({ server: httpsServer || httpServer });
      registerChannels(wss);
    } catch (err) {
      console.error('[WSS] WebSocket 未启动:', (err as Error).message);
    }
  }
  // --- 4. 启动监听 ---
  httpServer.listen(httpPort, () => {
    console.log(`[Worker ${process.pid}] 🔓 HTTP Server: http://${config.url || 'localhost'}:${httpPort}`);
  });
  if (httpsServer) {
    const httpsPort = config.https_port;
    httpsServer.listen(httpsPort, () => {
      console.log(`[Worker ${process.pid}] 🔒 HTTPS Server: https://${config.url || 'localhost'}:${httpsPort}`);
    });
  }
  // --- 5. 启动计划任务 ---
  try {
    bootScheduling();
  } catch (err) {
    console.error('[schedule] Schedule 未启动:', (err as Error).message);
  }
});