/**
 * @Author: trexwb
 * @Date: 2026-03-27 11:30:00
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/utils/Logger.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 * 
 * 统一日志工具
 * 使用 levels: debug < info < warn < error < fatal
 * 开发环境输出可读格式，生产环境输出 JSON 结构化日志
 */
import { config } from '#bootstrap/configLoader';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

const currentLevel: LogLevel =
  (config('app.log.level') as LogLevel) || 'info';

const isProduction = config('app.env') === 'production';

function formatMessage(level: LogLevel, message: string, meta?: Record<string, any>): object {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    pid: process.pid,
    message,
    ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
  };
  return logEntry;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[currentLevel];
}

function write(level: LogLevel, message: string, ...args: any[]) {
  if (!shouldLog(level)) return;

  const meta = args.length > 0 && typeof args[0] === 'object'
    ? (args.shift() as Record<string, any>)
    : undefined;

  const extra = args.length > 0 ? args : undefined;

  if (isProduction) {
    // 生产环境：JSON 结构化日志
    console.log(JSON.stringify(formatMessage(level, message, {
      ...meta,
      ...(extra ? { extra } : {}),
    })));
  } else {
    // 开发环境：彩色可读格式
    const colorMap: Record<LogLevel, string> = {
      debug: '\x1b[36m',  // 青色
      info: '\x1b[32m',   // 绿色
      warn: '\x1b[33m',   // 黄色
      error: '\x1b[31m',  // 红色
      fatal: '\x1b[35m',  // 紫色
    };
    const reset = '\x1b[0m';
    const color = colorMap[level];
    const prefix = `[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] ${level.toUpperCase().padEnd(5)}`;
    console.log(`${color}${prefix}${reset} ${message}`, ...(meta ? [meta] : []), ...(extra || []));
  }
}

export const logger = {
  debug(message: string, ...args: any[]) { write('debug', message, ...args); },
  info(message: string, ...args: any[]) { write('info', message, ...args); },
  warn(message: string, ...args: any[]) { write('warn', message, ...args); },
  error(message: string, ...args: any[]) { write('error', message, ...args); },
  fatal(message: string, ...args: any[]) { write('fatal', message, ...args); },
};
