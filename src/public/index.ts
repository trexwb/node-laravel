/*
 * @Author: trexwb
 * @Date: 2026-03-27 11:30:00
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 13:45:00
 * @FilePath: /node-laravel/src/public/index.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 * 
 * 应用入口 — Cluster 模式统一入口
 */
import 'dotenv/config';
import { bootstrap } from '#bootstrap/app';
import { runWithCluster } from '#bootstrap/cluster';
import { config } from '#bootstrap/configLoader';
import { logger } from '#utils/Logger';

runWithCluster(async () => {
  const appConfig = config('app');

  // 🔌 独立 WebSocket 进程检测
  if (process.env.NODE_IS_WS === 'true') {
    const { createStandaloneWebSocketServer } = await import('#bootstrap/websocket');
    logger.info('[WS Standalone] WebSocket 独立进程模式启动');
    await createStandaloneWebSocketServer(appConfig.ws?.port);
    return;
  }

  // 普通入口：启动 HTTP + 定时任务
  await bootstrap();
});
