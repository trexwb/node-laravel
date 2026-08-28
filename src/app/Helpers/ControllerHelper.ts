/*
 * @Author: trexwb
 * @Date: 2026-03-21 13:00:00
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-17 15:21:00
 * @FilePath: /stl/server/src/app/Helpers/ControllerHelper.ts
 * @Description:
 * Controller 辅助函数
 * 一花一世界，一叶如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { WrappedControllerError } from '#types/helpers'

/**
 * 包装 Controller 错误，统一错误格式
 * @param controller 控制器名
 * @param method 方法名
 * @param err 错误对象
 * @returns 格式化后的错误
 */
export function wrapControllerError(controller: string, method: string, err: unknown): WrappedControllerError {
  const code = `${controller}.${method}:${(err as { code?: unknown })?.code || 'unknown'}`
  const message = err instanceof Error ? err.message || String(err) : String(err)
  const wrapped = new Error(message) as WrappedControllerError
  wrapped.code = code
  wrapped.originalError = err
  return wrapped
}

/**
 * 构建标准列表查询过滤条件
 * @param body 请求体
 * @param allowedFields 允许的过滤字段
 * @returns 过滤条件对象
 */
export function buildFilters(body: Record<string, unknown>, allowedFields: string[]): Record<string, unknown> {
  const filters: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
      filters[field] = body[field]
    }
  }
  return filters
}

/**
 * 提取分页参数
 * @param body 请求体
 * @param defaults 默认值
 * @returns { page, pageSize }
 */
export function getPagination(body: Record<string, unknown>, defaults = { page: 1, pageSize: 10 }) {
  const page = Math.max(1, parseInt(String(body.page)) || defaults.page)
  const pageSize = Math.min(100, Math.max(1, parseInt(String(body.pageSize)) || defaults.pageSize))
  return { page, pageSize }
}
