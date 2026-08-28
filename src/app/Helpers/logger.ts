/*
 * @Author: trexwb
 * @Date: 2026-04-08
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-08
 * @FilePath: node-laravel/src/app/Helpers/logger.ts
 * @Description:
 * 统一结构化日志（pino）
 *
 * 使用方式：
 *   import { logger } from '#app/Helpers/logger';
 *   logger.info({ userId: 123 }, '用户登录成功');
 *   logger.error({ err }, '数据库查询失败');
 *
 * 字段说明：
 *   - traceId：自动从 AsyncLocalStorage 注入（请求上下文内自动带出）
 *   - pid：进程号
 *   - module：调用方模块（调用时手动传入，如 { module: 'QueueWorker' }）
 *
 * 安全约定：
 *   - 禁止在日志字段中打印 Authorization、app-secret、签名原文、密码哈希等敏感信息
 *   - 异常日志只记录 err.message + err.code，不要把整个 err.stack 记录到 info 以上级别
 *
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { getTraceId } from '#app/Helpers/requestContext'
import pino from 'pino'

const isDev = (process.env.APP_ENV || process.env.NODE_ENV || 'development') !== 'production'
/**
 * pino 日志实例（全局单例）
 *
 * 开发环境：pino-pretty 彩色可读输出
 * 生产环境：标准 JSON 输出（适合日志采集系统）
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // 自动注入 traceId（从 AsyncLocalStorage 读取）
  mixin() {
    return {
      traceId: getTraceId(),
      pid: process.pid,
    }
  },

  // 时间戳使用 ISO 8601 格式
  timestamp: pino.stdTimeFunctions.isoTime,

  // 序列化 Error 对象（自动提取 message、stack、code）
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },

  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
          messageFormat: '[{module}] {msg}',
        },
      }
    : undefined,
})

/**
 * 创建带固定 module 标签的子 logger（避免每次手动传 { module: '...' }）
 *
 * 示例：
 *   const log = createLogger('QueueWorker');
 *   log.info('Worker is running...');  // 自动带 module: 'QueueWorker'
 */
export function createLogger(module: string): pino.Logger {
  return logger.child({ module })
}
