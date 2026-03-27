/*
 * @Author: trexwb
 * @Date: 2026-03-27 11:30:00
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/public/index.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 * 
 * 应用入口 — Cluster 模式统一入口
 * 根据 ws.mode 配置决定 WebSocket 运行模式：
 *   - standalone: WebSocket 独立进程运行（生产环境推荐）
 *   - shared: 与 HTTP 共享进程（简单场景）
 */
import 'dotenv/config';
import { bootstrap } from '#bootstrap/app';
import { runWithCluster } from '#bootstrap/cluster';
import { createStandaloneWebSocketServer } from '#bootstrap/websocket';
import { config } from '#bootstrap/configLoader';
import { logger } from '#utils/Logger';

runWithCluster(async () => {
  const appConfig = config('app');

  // Cluster 模式下，WebSocket 选择独立进程或共享进程
  if (appConfig.ws?.enabled && appConfig.ws.mode === 'standalone') {
    // 🔌 独立 WebSocket 进程（仅 Master 创建，避免端口冲突）
    if (process.env.NODE_IS_WS === 'true') {
      logger.info('[WS Standalone] WebSocket 独立进程模式启动');
      await createStandaloneWebSocketServer(appConfig.ws.port);
      return;
    }
  }

  // 普通入口：启动 HTTP + 定时任务
  await bootstrap(app as any);
});
