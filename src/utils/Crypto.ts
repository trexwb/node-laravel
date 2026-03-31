/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 13:45:00
 * @FilePath: /node-laravel/src/utils/Crypto.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import crypto from 'node:crypto';
import { config } from '#bootstrap/configLoader';
import { logger } from '#utils/Logger';

// 启动时必须已验证安全配置，否则抛异常
let APP_KEY: Buffer;
let APP_IV: Buffer;

try {
  const appKeyStr = config('app.security.app_key') || '';
  const appIvStr = config('app.security.app_iv') || '';

  // 强制要求密钥存在
  if (!appKeyStr || !appIvStr) {
    throw new Error('APP_KEY 或 APP_IV 未配置');
  }

  // 统一转换为 Buffer，长度不够则补齐（警告后补），超长则截断
  APP_KEY = Buffer.alloc(32);
  Buffer.from(appKeyStr).copy(APP_KEY);
  if (Buffer.from(appKeyStr).length !== 32) {
    logger.warn(`[Crypto] APP_KEY 长度 ${Buffer.from(appKeyStr).length} ≠ 32，已自动补齐`);
  }

  APP_IV = Buffer.alloc(16);
  Buffer.from(appIvStr).copy(APP_IV);
  if (Buffer.from(appIvStr).length !== 16) {
    logger.warn(`[Crypto] APP_IV 长度 ${Buffer.from(appIvStr).length} ≠ 16，已自动补齐`);
  }
} catch (err) {
  logger.error('[Crypto] 密钥初始化失败，请检查 APP_KEY / APP_IV 环境变量');
  throw err;
}

const ALGORITHM = 'aes-256-cbc';

export class Crypto {
  // ============================================================
  // 摘要算法
  // ============================================================
  public static md5(str: string): string {
    return crypto.createHash('md5').update(str).digest('hex');
  }

  public static sha256(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  public static sha1(encryptedData: string, keyStr: string | false = false): string {
    return crypto.createHmac('sha1', keyStr || APP_KEY).update(encryptedData).digest('base64');
  }

  // ============================================================
  // AES-256-CBC 加密/解密
  // ============================================================
  public static encrypt(data: any, keyStr?: string | false, ivStr?: string | false): string | undefined {
    if (data === undefined || data === null) return undefined;
    const key = keyStr ? Buffer.from(keyStr) : APP_KEY;
    const iv = ivStr ? Buffer.from(ivStr) : APP_IV;
    const text = typeof data === 'string' ? data : JSON.stringify(data);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  public static decrypt(encryptedText: string, keyStr?: string | false, ivStr?: string | false): any {
    if (!encryptedText) return undefined;
    const key = keyStr ? Buffer.from(keyStr) : APP_KEY;
    const iv = ivStr ? Buffer.from(ivStr) : APP_IV;

    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      // 尝试解析为 JSON
      try {
        return JSON.parse(decrypted);
      } catch {
        // 非 JSON 字符串则直接返回原文
        return decrypted;
      }
    } catch (err) {
      logger.error(`[Crypto] 解密失败: ${(err as Error).message}`);
      throw new Error('Decryption failed: invalid data or key mismatch');
    }
  }

  // ============================================================
  // Token 生成与校验
  // ============================================================
  public static generateToken(payload: string): string {
    return this.encrypt(payload) as string;
  }

  public static decryptToken(encryptedText: string): any {
    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, APP_KEY, APP_IV);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (err) {
      logger.error(`[Crypto] Token 解密失败: ${(err as Error).message}`);
      throw new Error('Token decryption failed');
    }
  }

  // ============================================================
  // 工具：生成随机密钥（用于生成 APP_KEY / APP_IV）
  // ============================================================
  public static generateSecureKey(length: 16 | 32 = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
