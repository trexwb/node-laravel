/*
 * @Author: trexwb
 * @Date: 2026-02-05
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27
 * @FilePath: node-laravel/src/bootstrap/configLoader.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import app from '#config/app'
import database from '#config/database'
import cache from '#config/cache'
import * as _ from 'lodash-es'

/** 各配置模块的实际类型（供 `config<T>()` 显式标注，避免 any 扩散到调用方） */
export type AppConfig = typeof app
export type DatabaseConfig = typeof database
export type CacheConfig = typeof cache

const configs = {
  app,
  database,
  cache,
}

// ============================================================
// 安全配置验证 — 启动时强制检查关键密钥
// ============================================================
export function validateSecurityConfig(): void {
  const appSecurity = configs.app?.security
  if (!appSecurity) {
    throw new Error(
      '[FATAL] app.security 配置缺失，请检查 config/app.ts\n' +
      '提示：APP_KEY 和 APP_IV 必须通过环境变量配置，禁止使用硬编码默认值'
    )
  }

  const { app_key, app_iv } = appSecurity

  // 🔴 必须提供密钥，拒绝不安全的默认值
  if (!app_key || app_key.trim() === '') {
    throw new Error(
      '[FATAL] APP_KEY 环境变量未设置\n' +
      '请在 .env 中添加：APP_KEY=<32位随机字符串>\n' +
      '示例：APP_KEY=$(openssl rand -hex 32)'
    )
  }

  if (!app_iv || app_iv.trim() === '') {
    throw new Error(
      '[FATAL] APP_IV 环境变量未设置\n' +
      '请在 .env 中添加：APP_IV=<16位随机字符串>\n' +
      '示例：APP_IV=$(openssl rand -hex 16)'
    )
  }

  // 🔐 密钥长度校验：与 CryptoTool 一致，必须为 32 字节（启动期拦截，避免运行期加密时才崩溃）
  if (Buffer.byteLength(app_key) !== 32) {
    throw new Error(
      `[FATAL] APP_KEY 长度必须为 32 字节（当前 ${Buffer.byteLength(app_key)} 字节）\n` +
      '示例：APP_KEY=$(openssl rand -hex 32)（64 位十六进制字符 = 32 字节）'
    )
  }

  // APP_IV 不再强校验长度：AES-256-GCM 下 IV 会经 SHA-256 派生为 12 字节，
  // 任意长度配置均可安全使用（仅建议使用 12/16 字节随机串）。
}

/**
 * 模拟 Laravel 的 config() 辅助函数
 * 支持小点语法获取配置，如: config('database.host')
 * 泛型 T 允许调用方显式标注返回类型（不标注时默认 unknown，强制调用方做类型收窄）。
 */
export function config<T = unknown>(path: string, defaultValue?: T): T {
  return _.get(configs, path, defaultValue) as T
}

/**
 * 判断是否为生产环境
 */
export function isProduction(): boolean {
  return config<string>('app.env') === 'production'
}

/**
 * 判断是否启用调试模式
 */
export function isDebug(): boolean {
  return config<boolean>('app.debugger') === true
}
