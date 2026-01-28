import type { Request, Response, NextFunction } from 'express';
import { config } from '#bootstrap/configLoader';
import { Crypto } from '#utils/Crypto';
import * as _ from 'lodash-es';

const SENSITIVE_PATHS = [
  'password',
  'rememberToken',
  'secret',
  'password',
  'appSecret',
  'appIv'
];

const omitByPath = <T = any>(obj: T): T => {
  const clone = _.cloneDeep(obj);
  SENSITIVE_PATHS.forEach(path => _.unset(clone as any, path));
  return clone;
};

export const shapeData = (
  rawData: any,
  requestedFields?: string[]
) => {
  if (!rawData || typeof rawData !== 'object') return rawData;
  const pickIfNeeded = (item: any) => {
    const cleaned = omitByPath(item);
    return requestedFields?.length
      ? _.pick(cleaned, requestedFields)
      : cleaned;
  };
  // 列表
  if (Array.isArray(rawData)) {
    return rawData.map(pickIfNeeded);
  }
  // Laravel 分页格式
  if (Array.isArray(rawData.data)) {
    return {
      ...rawData,
      data: rawData.data.map(pickIfNeeded),
    };
  }
  // 单条数据
  return pickIfNeeded(rawData);
};

export const encryptResponse = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const encryptEnabled = config('app.security.return_encrypt');
  const fieldsParam = req.query.fields as string | undefined;
  const requestedFields = fieldsParam?.split(',').map(f => f.trim()).filter(Boolean);
  const originalJson = res.json;
  res.json = function (payload: any): Response {
    if (!payload || typeof payload !== 'object' || !payload.data) {
      return originalJson.call(this, payload);
    }
    const sourceData = payload.data ?? payload;
    // 1️⃣ 数据裁剪（永远执行）
    const shapedData = shapeData(sourceData, requestedFields);
    // 2️⃣ 不加密：直接返回
    if (!encryptEnabled) {
      payload.data = shapedData;
      return originalJson.call(this, payload);
    }
    // 3️⃣ 加密
    const appKey = (req as any).secretRow?.appSecret || config('app.security.app_key');
    const appIv = (req as any).secretRow?.appIv || config('app.security.app_iv');
    payload.encryptedData = Crypto.encrypt(
      JSON.stringify(shapedData),
      appKey,
      appIv
    );
    delete payload.data;
    return originalJson.call(this, payload);
  };
  next();
};