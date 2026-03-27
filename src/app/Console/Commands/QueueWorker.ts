/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/app/Console/Commands/QueueWorker.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import { JobsModel } from '#app/Models/JobsModel';
import { SendWelcomeEmail } from '#app/Jobs/SendWelcomeEmail';
import { logger } from '#utils/Logger';

// ============================================================
// 任务注册表 — 字符串类名 → Class 引用
// 新增 Job 时在此注册，无需改动 run() 逻辑
// ============================================================
const jobRegistry: Record<string, new (params: any) => { handle(): Promise<void> }> = {
  SendWelcomeEmail,
  // 'GenerateInvoice': GenerateInvoice,
  // 'ProcessPayment':  ProcessPayment,
};

// ============================================================
// 指数退避配置
// ============================================================
interface BackoffConfig {
  /** 初始等待时间（毫秒） */
  baseDelayMs: number;
  /** 最大等待时间（毫秒） */
  maxDelayMs: number;
  /** 退避乘数 */
  multiplier: number;
}

const BACKOFF: BackoffConfig = {
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  multiplier: 2,
};

function computeBackoff(attempts: number): number {
  const delay = BACKOFF.baseDelayMs * Math.pow(BACKOFF.multiplier, attempts - 1);
  return Math.min(delay, BACKOFF.maxDelayMs);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
export class QueueWorker {
  private running = false;

  public async run(): Promise<void> {
    if (this.running) return;
    this.running = true;

    logger.info('[QueueWorker] Worker 已启动');
    process.on('SIGTERM', async () => {
      logger.info('[QueueWorker] 收到 SIGTERM，正在停止...');
      this.running = false;
    });

    while (this.running) {
      try {
        const jobRecord = await JobsModel.getNextAvailable();

        if (jobRecord) {
          await this.processJob(jobRecord);
        } else {
          // 🔁 无任务时：初始等待 1s，空闲超过 30s 则逐步延长等待
          await sleep(1000);
        }
      } catch (err) {
        logger.error('[QueueWorker] 获取任务时出错:', err);
        await sleep(5000); // 出错时等待 5s 再重试
      }
    }

    logger.info('[QueueWorker] Worker 已停止');
  }

  private async processJob(jobRecord: any): Promise<void> {
    const jobId = jobRecord.id;
    const payload = typeof jobRecord.payload === 'string'
      ? JSON.parse(jobRecord.payload)
      : jobRecord.payload;

    const attempts = (jobRecord.attempts || 0) + 1;

    try {
      // 🔒 锁定任务（防止重复执行）
      await jobRecord.$query().patch({
        reserved_at: new Date(),
        attempts,
      } as any);

      // 🔍 查找注册的 Job 类
      const JobClass = jobRegistry[payload.className];
      if (!JobClass) {
        throw new Error(`Job class "${payload.className}" 未在 registry 中注册`);
      }

      // ⚡ 执行
      const instance = new JobClass(payload.params);
      await instance.handle();

      // ✅ 成功后删除任务
      await jobRecord.$query().delete();
      logger.debug(`[QueueWorker] Job #${jobId} (${payload.className}) 执行成功`);

    } catch (err: any) {
      logger.error(`[QueueWorker] Job #${jobId} 执行失败 (attempt ${attempts}):`, err.message);

      const nextDelay = computeBackoff(attempts);

      if (attempts >= 5) {
        // ❌ 重试超过上限，标记为失败并停止重试
        await jobRecord.$query().patch({
          failed_at: new Date(),
          last_error: err.message,
          reserved_at: null,
        } as any);
        logger.error(`[QueueWorker] Job #${jobId} 重试失败，已放弃`);
      } else {
        // 🔄 释放锁定，下次重新拾取（使用退避等待）
        await jobRecord.$query().patch({
          attempts,
          reserved_at: null,
          available_at: new Date(Date.now() + nextDelay),
        } as any);
        logger.warn(`[QueueWorker] Job #${jobId} 将于 ${nextDelay}ms 后重试 (attempt ${attempts}/5)`);
        await sleep(nextDelay);
      }
    }
  }
}
