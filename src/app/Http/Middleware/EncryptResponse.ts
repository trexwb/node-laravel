/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/app/Http/Middleware/EncryptResponse.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Request, Response, NextFunction } from 'express';
import { config } from '#bootstrap/configLoader';
import { Crypto } from '#utils/Crypto';
import * as _ from 'lodash-es';
import { logger } from '#utils/Logger';

// ============================================================
// 敏感字段黑名单 — 响应时自动排除
// ============================================================
const SENSITIVE_PATHS = [
  'password',
  'rememberToken',
  'secret',
  'appSecret',
  'appIv',
  'salt',
  'token',
  'apiKey',
];

const omitSensitive = <T = unknown>(obj: T): T => {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = _.cloneDeep(obj as object);
  for (const path of SENSITIVE_PATHS) {
    _.unset(clone as any, path);
  }
  return clone as T;
};

const shapeData = (
  rawData: unknown,
  requestedFields?: string[]
): unknown => {
  if (!rawData || typeof rawData !== 'object') return rawData;

  const pickIfNeeded = (item: unknown) => {
    const cleaned = omitSensitive(item);
    if (!requestedFields?.length) return cleaned;
    if (Array.isArray(cleaned)) {
      return cleaned.map((i: unknown) => _.pick(i as object, requestedFields));
    }
    return _.pick(cleaned as object, requestedFields);
  };

  if (Array.isArray(rawData)) return rawData.map(pickIfNeeded);

  // Laravel 分页格式 { data: [...], meta: {...} }
  if ('data' in (rawData as Record<string, unknown>) && Array.isArray((rawData as any).data)) {
    return {
      ...(rawData as object),
      data: (rawData as any).data.map(pickIfNeeded),
    };
  }

  return pickIfNeeded(rawData);
};

export const encryptResponse = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const encryptEnabled = config('app.security.return_encrypt');
  const fieldsParam = req.query.fields as string | undefined;
  const requestedFields = fieldsParam?.split(',').map(f => f.trim()).filter(Boolean);

  const originalJson = res.json.bind(res);

  res.json = function (payload: unknown): Response {
    if (!payload || typeof payload !== 'object' || !('data' in (payload as object))) {
      return originalJson(payload);
    }

    // 1️⃣ 敏感字段脱敏（始终执行）
    const sourceData = (payload as any).data ?? payload;
    const shapedData = shapeData(sourceData, requestedFields);

    if (!encryptEnabled) {
      (payload as any).data = shapedData;
      return originalJson(payload);
    }

    // 2️⃣ 加密响应
    try {
      const appKey = req.secretRow?.appSecret || config('app.security.app_key');
      const appIv = req.secretRow?.appIv || config('app.security.app_iv');
      const encrypted = Crypto.encrypt(JSON.stringify(shapedData), appKey, appIv);

      // 构建加密响应体（与原接口保持兼容）
      const encryptedPayload = {
        code: (payload as any).code,
        msg: (payload as any).msg,
        encryptedData: encrypted,
      };
      delete (payload as any).data;
      return originalJson(encryptedPayload);
    } catch (err) {
      logger.error('[EncryptResponse] 响应加密失败:', err);
      // 加密失败时降级为不加密
      (payload as any).data = shapedData;
      return originalJson(payload);
    }
  };

  next();
};
