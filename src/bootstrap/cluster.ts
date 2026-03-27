/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 13:45:00
 * @FilePath: /node-laravel/src/bootstrap/cluster.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import cluster from 'node:cluster';
import os from 'node:os';
import { config } from '#bootstrap/configLoader';
import { logger } from '#utils/Logger';

interface ClusterOptions {
  /** 是否启用集群 */
  enabled?: boolean;
  /** Worker 数量：'auto' | number */
  workers?: 'auto' | number;
}

export function runWithCluster(
  boot: (isMaster: boolean) => Promise<void>,
  options: ClusterOptions = {}
) {
  const { enabled = config('app.cluster.enabled'), workers } = options;
  const wsEnabled = config('app.ws.enabled');
  const wsMode = config('app.ws.mode');

  // ============================================================
  // 独立 WebSocket 进程检测
  // ============================================================
  if (process.env.NODE_IS_WS === 'true') {
    boot(false);
    return;
  }

  // ============================================================
  // 非集群模式
  // ============================================================
  if (!enabled || !cluster.isPrimary) {
    boot(true);
    return;
  }

  // ============================================================
  // 集群模式（Primary 进程）
  // ============================================================
  const numCPUs = workers === 'auto' || !workers
    ? os.cpus().length
    : parseInt(String(workers)) || os.cpus().length;

  logger.info(`[Cluster] Master 进程 ${process.pid} 启动，正在调度 ${numCPUs} 个 Worker...`);

  // 🔌 如果 WebSocket 开启 standalone 模式，启动独立的 WebSocket Worker
  if (wsEnabled && wsMode === 'standalone') {
    const wsEnv = { ...process.env, NODE_IS_WS: 'true' };
    const wsWorker = cluster.fork(wsEnv);
    wsWorker.on('online', () => {
      logger.info(`[Cluster] WebSocket Worker ${wsWorker.process.pid} 已启动`);
    });
    wsWorker.on('exit', (code, signal) => {
      logger.warn(`[Cluster] WebSocket Worker 退出 (code=${code} signal=${signal})，正在重启...`);
      cluster.fork(wsEnv);
    });
  }

  // 🚀 HTTP Workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    // WebSocket Worker 退出时不应重启（已由上面单独处理）
    // 注：worker.process.env 在 Node.js 中不可用，改用全局 process.env 检查
    // 实际上 fork 时传入的 env 会合并到 worker 进程的 process.env
    if (process.env.NODE_IS_WS === 'true') {
      return;
    }
    logger.warn(
      `[Cluster] Worker ${worker.process.pid} 退出 (code=${code} signal=${signal})，` +
      `正在重新拉起...`
    );
    cluster.fork();
  });

  cluster.on('fork', (worker) => {
    logger.debug(`[Cluster] Worker ${worker.process.pid} 正在启动...`);
  });

  cluster.on('online', (worker) => {
    logger.info(`[Cluster] Worker ${worker.process.pid} 已就绪`);
  });
}
