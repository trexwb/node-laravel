/*
 * @Author: trexwb
 * @Date: 2026-04-17
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/app/Console/Commands/QueueWorker.ts
 * @Description:
 * 数据库队列 Worker — 轻量化轮询队列
 * 框架版：队列存取由 queue.store 注入，Job 类解析由 queue.jobResolver 注入，不依赖业务 Model/Job
 *
 * 使用方式：
 *   npm run artisan:dev -- queue:work    # 开发环境
 *   npm run artisan -- queue:work         # 生产环境
 *
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { Container } from '#app/Foundation/Container'
import knexConfig from '#database/knexfile'
import { formatDate } from '#app/Helpers/format'
import { createLogger } from '#app/Helpers/logger'
import knexLib from 'knex'
import { Model } from 'objection'
import type { JobResolver, QueueJobRow, QueueStore } from '#types/framework'

const log = createLogger('QueueWorker')

// ─── 常量配置 ─────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 1000 // 队列为空时的轮询间隔
const BURST_INTERVAL_MS = 50 // 刚处理完任务后的短暂间隔（快速连续消费）
const MAX_ATTEMPTS = 3 // 任务最大重试次数
const DB_WARMUP_INTERVAL_MS = 30000 // 每 30 秒主动检测一次 DB 连接
const RELEASE_TIMEOUT_SEC = 60 // 预留任务超时时间（秒）

/**
 * 数据库队列 Worker
 */
export class QueueWorker {
  private static running = false
  private static lastDbWarmupAt = 0

  /**
   * 启动 Worker — 单线程轮询模式
   */
  public static async run(): Promise<void> {
    if (this.running) {
      log.warn('Worker 已在运行中，忽略重复启动')
      return
    }
    this.running = true

    log.info({ pollIntervalMs: POLL_INTERVAL_MS, maxAttempts: MAX_ATTEMPTS }, '数据库队列 Worker 启动')

    // 注册优雅退出信号
    this.setupGracefulShutdown()

    // 启动前预热 DB 连接
    await this.warmupDb()

    // 主循环
    while (this.running) {
      try {
        // 定期检测 DB 连接健康状态
        await this.ensureDbConnection()

        const hasJob = await this.pollAndProcess()

        // 自适应休眠：处理完任务后立即轮询（burst 模式），否则正常休眠
        if (!hasJob) {
          await this.sleep(POLL_INTERVAL_MS)
        } else {
          await this.sleep(BURST_INTERVAL_MS)
        }
      } catch (err) {
        const isConnErr = this.isConnectionError(err)
        log.error({ err: (err as { message?: string })?.message, isConnectionError: isConnErr }, '轮询循环异常')

        // 连接异常时主动重建连接
        if (isConnErr) {
          await this.reconnectDb()
        }

        await this.sleep(POLL_INTERVAL_MS)
      }
    }

    log.info('Worker 已关闭')
    process.exit(0)
  }

  /**
   * 注册退出信号监听
   */
  private static setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      log.info({ signal }, '收到退出信号，正在关闭 Worker...')
      this.running = false
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  }

  /**
   * 轮询并处理单个任务
   * @returns 是否处理了任务（用于 burst 模式判断）
   */
  private static async pollAndProcess(): Promise<boolean> {
    // 从队列存储拾取一条待处理任务（由 queue.store 实现 FOR UPDATE SKIP LOCKED 防并发）
    const store = Container.resolve<QueueStore>('queue.store')
    const job = await store.getNextAvailable()

    if (!job) {
      return false
    }

    // 执行任务
    await this.processJob(job)
    return true
  }

  /**
   * 处理单个任务（原子性保证）
   */
  private static async processJob(job: QueueJobRow): Promise<void> {
    const jobId = job.id
    let className = 'unknown'

    try {
      // P2 修复：JSON.parse 移入 try 内，损坏 payload 走 markFailed 流程（而非让任务永久卡死）
      const payload = typeof job.payload === 'string' ? JSON.parse(job.payload as string) : job.payload
      const parsed = payload as { className: string; params: unknown }
      className = parsed.className
      const params = parsed.params

      log.info({ jobId, className, attempts: job.attempts, reservedAt: formatDate() }, '开始处理任务')

      // Job 类由业务方通过 queue.jobResolver 注册解析
      const jobResolver = Container.resolve<JobResolver>('queue.jobResolver', () => () => undefined)
      const JobClass = jobResolver(className)
      if (!JobClass) {
        throw new Error(`Job class '${className}' not found. Register it via 'queue.jobResolver'.`)
      }

      const instance = new JobClass(params)
      await instance.handle()

      // 成功：标记完成（由 queue.store 实现删除/归档行为）
      await Container.resolve<QueueStore>('queue.store').markDone(jobId)
      log.info({ jobId, className }, '任务处理成功')
    } catch (err) {
      log.error({ jobId, className, err: (err as { message?: string })?.message, attempts: job.attempts }, '任务处理失败')

      // 失败：增加重试次数；由 queue.store 决定释放重试或标记失败
      const newAttempts = (job.attempts as number) + 1
      await Container.resolve<QueueStore>('queue.store').markFailed(jobId, newAttempts, MAX_ATTEMPTS)
      log.warn(
        { jobId, className, attempts: newAttempts, maxAttempts: MAX_ATTEMPTS },
        newAttempts >= MAX_ATTEMPTS ? '任务已失败（重试次数耗尽）' : '任务将在下次重试'
      )
    }
  }

  /**
   * 休眠工具函数
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // ─── DB 连接保活机制 ───────────────────────────────────────────────────────

  /**
   * 启动时预热 DB 连接，确保连接池就绪
   */
  private static async warmupDb(): Promise<void> {
    try {
      await Model.knex().raw('SELECT 1')
      this.lastDbWarmupAt = Date.now()
      log.info('DB 连接预热完成')
    } catch (err) {
      log.warn({ err: (err as { message?: string })?.message }, 'DB 预热失败，尝试重建连接')
      await this.reconnectDb()
    }
  }

  /**
   * 定期检测 DB 连接是否存活 + 释放超时任务
   */
  private static async ensureDbConnection(): Promise<void> {
    const now = Date.now()
    if (now - this.lastDbWarmupAt < DB_WARMUP_INTERVAL_MS) return

    this.lastDbWarmupAt = now

    try {
      await Model.knex().raw('SELECT 1')

      // 释放超时的预留任务（每 30 秒执行一次）
      const released = await Container.resolve<QueueStore>('queue.store').releaseTimedOutJobs(RELEASE_TIMEOUT_SEC)
      if (released > 0) {
        log.info({ released }, '已释放超时预留任务')
      }
    } catch (err) {
      log.warn({ err: (err as { message?: string })?.message }, 'DB 连接检测失败，尝试重连')
      await this.reconnectDb()
    }
  }

  /**
   * 重建数据库连接（销毁旧连接池，创建新 knex 实例）
   */
  private static async reconnectDb(): Promise<void> {
    try {
      const oldKnex = Model.knex()
      await oldKnex.destroy().catch(() => {})
      const newKnex = knexLib(knexConfig)
      Model.knex(newKnex)
      await newKnex.raw('SELECT 1')
      this.lastDbWarmupAt = Date.now()
      log.info('DB 连接已重建')
    } catch (err) {
      log.error({ err: (err as { message?: string })?.message }, '重建 DB 连接时出错，将在下次循环重试')
    }
  }

  /**
   * 判断是否为数据库连接类错误
   */
  private static isConnectionError(err: unknown): boolean {
    if (!err) return false
    const errLike = err as { code?: string; cause?: { code?: string }; message?: string }
    const code = errLike.code || errLike.cause?.code || ''
    const msg = (errLike.message || '').toLowerCase()
    return (
      code === 'ECONNRESET' ||
      code === 'ECONNREFUSED' ||
      code === 'PROTOCOL_CONNECTION_LOST' ||
      code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' ||
      code === 'ETIMEDOUT' ||
      msg.includes('connection lost') ||
      msg.includes('gone away') ||
      msg.includes('broken pipe') ||
      msg.includes('socket hang up')
    )
  }
}
