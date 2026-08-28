/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/types/errors.d.ts
 * @Description:
 * 通用错误类型 — AppError 扩展，统一携带业务错误码（code）与字段（field），调用方可直接访问 err.code / err.field 而无需二次断言。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
/** 携带业务错误码 / 字段信息的 Error 扩展 */
export interface AppError extends Error {
  /** 结构化错误码（如 'ENUM_VIOLATION'、'BaseModel:insert:emptyFields'） */
  code?: string
  /** 触发错误的字段名（可选，校验类错误使用） */
  field?: string
}
