/*
 * @Author: trexwb
 * @Date: 2026-03-24 09:45:06
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-17 15:21:00
 * @FilePath: /stl/server/src/utils/query.ts
 * @Description:
 * 查询工具函数 — 缓存键生成、分页规范化、排序辅助
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { PaginationConfig, SortConfig } from '#types/helpers'
export type { PaginationConfig, SortConfig } from '#types/helpers'

/**
 * 排序配置接口
 */
/**
 * 分页配置接口
 */

/**
 * 规范化分页参数
 * @param page - 页码
 * @param pageSize - 每页数量
 * @returns 规范化的分页配置
 */
export const normalizePagination = (page?: unknown, pageSize?: unknown): PaginationConfig => {
  const safePage = toSafeInteger(page ?? 1)
  const safePageSize = toSafeInteger(pageSize ?? 10)

  return {
    page: Math.max(1, safePage),
    pageSize: Math.max(1, Math.min(safePageSize, 100)), // 限制每页最多 100 条
  }
}

/**
 * 安全转换为整数
 * @param value - 需要转换的值
 * @returns 安全的整数值
 */
export const toSafeInteger = (value: unknown): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return Number.isInteger(value) ? value : Math.floor(value)
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : Math.floor(parsed)
  }
  return 0
}

/**
 * 为缓存键生成排序后的对象（避免因为键顺序不同导致不同的缓存键）
 * @param params - 需要排序的参数对象
 * @returns 排序后的 JSON 字符串
 */
export const sortForCacheKey = <T extends Record<string, unknown> | unknown[]>(params: T): string => {
  if (!params) return ''

  // 处理数组
  if (Array.isArray(params)) {
    return JSON.stringify(params.map((item) => (typeof item === 'object' && item !== null ? sortObjectKeys(item as Record<string, unknown>) : item)))
  }

  // 处理对象
  return JSON.stringify(sortObjectKeys(params))
}

/**
 * 递归排序对象的键（用于生成一致的缓存键）
 * @param obj - 需要排序的对象
 * @returns 排序后的新对象
 */
const sortObjectKeys = <T extends Record<string, unknown>>(obj: T): T => {
  const sortedObj: Record<string, unknown> = {}
  const keys = Object.keys(obj).sort()

  for (const key of keys) {
    const value = obj[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sortedObj[key] = sortObjectKeys(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      sortedObj[key] = value.map((item) =>
        typeof item === 'object' && item !== null ? sortObjectKeys(item as Record<string, unknown>) : item
      )
    } else {
      sortedObj[key] = value
    }
  }

  return sortedObj as T
}

/**
 * 构建列表查询的缓存键
 * @param cacheKeyPrefix - 缓存键前缀
 * @param filters - 过滤条件
 * @param pagination - 分页配置
 * @param sort - 排序配置
 * @param trashed - 是否包含软删除
 * @param graphExpr - 关联图谱表达式（可选）
 * @returns 完整的缓存键
 */
export const buildListCacheKey = (
  cacheKeyPrefix: string,
  filters: unknown,
  pagination: PaginationConfig,
  sort?: SortConfig,
  trashed: boolean = false,
  graphExpr?: string
): string => {
  const baseParams = [filters, pagination.page, pagination.pageSize, sort, trashed]
  if (graphExpr) {
    baseParams.push(graphExpr)
  }

  const sortedParams = sortForCacheKey(baseParams)
  const queryType = graphExpr ? 'list_graph' : 'list'

  return `${cacheKeyPrefix}[${queryType}:${sortedParams}]`
}

/**
 * 构建详情查询的缓存键
 * @param cacheKeyPrefix - 缓存键前缀
 * @param id - 记录 ID
 * @param graphExpr - 关联图谱表达式（可选）
 * @param trashed - 是否包含软删除
 * @returns 完整的缓存键
 */
export const buildDetailCacheKey = (cacheKeyPrefix: string, id: number, graphExpr?: string, trashed: boolean = false): string => {
  if (graphExpr) {
    return `${cacheKeyPrefix}[id:${id}][graph:${graphExpr}][trashed:${trashed ? 1 : 0}]`
  }
  return `${cacheKeyPrefix}[id:${id}]`
}
