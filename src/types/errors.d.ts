/**
 * 通用错误类型 — 替代 `(err as any).code = 'xxx'` 的散落写法。
 *
 * 使用方式：
 *   const err = new Error('...') as AppError
 *   err.code = 'ENUM_VIOLATION'
 *   err.field = key
 *   throw err
 *
 * 调用方可直接访问 err.code / err.field，无需二次断言。
 */

/** 携带业务错误码 / 字段信息的 Error 扩展 */
export interface AppError extends Error {
  /** 结构化错误码（如 'ENUM_VIOLATION'、'BaseModel:insert:emptyFields'） */
  code?: string
  /** 触发错误的字段名（可选，校验类错误使用） */
  field?: string
}
