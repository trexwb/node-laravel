#!/usr/bin/env node

/**
 * 阿里云函数计算启动器
 *
 * 在同一 Node.js 进程内同时运行 HTTP 服务 + 队列 Worker
 * 通过 START_QUEUE_WORKER=true 环境变量触发队列 Worker
 *
 * 设计决策：
 *   早期版本使用 child_process.spawn 分别启动 HTTP 和 Queue，
 *   但在 FC 容器中子进程存在以下问题：
 *   1. stdout 管道阻塞导致子进程 event loop 卡死
 *   2. FC 容器休眠/解冻后子进程无法可靠恢复
 *   3. detached:false 使子进程易被 FC 信号管理误杀
 *
 *   改为同进程模式后，HTTP 和 Queue 共享 event loop 和 DB 连接池，
 *   消除了所有子进程相关的可靠性问题。
 *
 * 使用方式：
 *   node scripts/start-fc.js
 *
 * 或直接:
 *   START_QUEUE_WORKER=true node ./src/public/index.js
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  execFileSync('node', ['./src/public/index.js'], {
    cwd: join(__dirname, '..'),
    stdio: 'inherit',
    env: {
      ...process.env,
      START_QUEUE_WORKER: 'true',
      FORCE_COLOR: '0',
    },
  });
} catch (err) {
  process.exit(err.status ?? 1);
}
