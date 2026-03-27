/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/bootstrap/configLoader.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import app from '#config/app';
import database from '#config/database';
import cache from '#config/cache';
import * as _ from 'lodash-es';

const configs: Record<string, any> = {
  app,
  database,
  cache
};

// ============================================================
// 安全配置验证 — 启动时强制检查关键密钥
// ============================================================
export function validateSecurityConfig(): void {
  const appSecurity = configs.app?.security;
  if (!appSecurity) {
    throw new Error(
      '[FATAL] app.security 配置缺失，请检查 config/app.ts\n' +
      '提示：APP_KEY 和 APP_IV 必须通过环境变量配置，禁止使用硬编码默认值'
    );
  }

  const { app_key, app_iv } = appSecurity;

  // 🔴 必须提供密钥，拒绝不安全的默认值
  if (!app_key || app_key.trim() === '') {
    throw new Error(
      '[FATAL] APP_KEY 环境变量未设置\n' +
      '请在 .env 中添加：APP_KEY=<32位随机字符串>\n' +
      '示例：APP_KEY=$(openssl rand -hex 32)'
    );
  }

  if (!app_iv || app_iv.trim() === '') {
    throw new Error(
      '[FATAL] APP_IV 环境变量未设置\n' +
      '请在 .env 中添加：APP_IV=<16位随机字符串>\n' +
      '示例：APP_IV=$(openssl rand -hex 16)'
    );
  }

  // 🔐 密钥长度校验
  if (Buffer.byteLength(app_key) !== 32) {
    console.warn(
      `[WARN] APP_KEY 长度应为 32 字节（当前 ${Buffer.byteLength(app_key)} 字节），` +
      `已自动补齐或截断处理，但建议使用 32 字节密钥`
    );
  }

  if (Buffer.byteLength(app_iv) !== 16) {
    console.warn(
      `[WARN] APP_IV 长度应为 16 字节（当前 ${Buffer.byteLength(app_iv)} 字节），` +
      `已自动补齐或截断处理，但建议使用 16 字节密钥`
    );
  }
}

/**
 * 模拟 Laravel 的 config() 辅助函数
 * 支持小点语法获取配置，如: config('database.host')
 */
export function config(path: string, defaultValue: any = null): any {
  return _.get(configs, path, defaultValue);
}

/**
 * 判断是否为生产环境
 */
export function isProduction(): boolean {
  return config('app.env') === 'production';
}

/**
 * 判断是否启用调试模式
 */
export function isDebug(): boolean {
  return config('app.debugger') === true;
}
