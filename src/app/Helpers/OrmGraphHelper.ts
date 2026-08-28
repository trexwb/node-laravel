/*
 * @Author: trexwb
 * @Date: 2026-03-19
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-28 17:30:00
 * @FilePath: node-laravel/src/app/Helpers/OrmGraphHelper.ts
 * @Description:
 * Service 层通用关联查询封装（Objection withGraphFetched）。
 *
 * Graph 语法规范（Objection.js）：
 * - `[a, b]`        → 加载 a 和 b 两个平级关系
 * - `[a.b]`         → 加载 a 关系下的 b 子关系
 * - `[a.[b, c]]`    → 加载 a 关系下的 b 和 c 子关系 ✅ 推荐
 * - `[a.b, a.c]`    → ❌ 错误语法，会导致关联数据加载失败
 *
 * 注意：dot-separated 语法（如 `a.b`）只有在方括号内作为单一关系时才有效。
 * 当需要加载多个子关系时，必须使用 `[a.[b, c]]` 格式。
 */

import type { BaseModel } from '#app/Models/BaseModel'
import type { AppError } from '#types/errors'
import type { SortOrder } from '#types/query'
import type { QueryBuilder } from 'objection'
import type { FindManyResult, GraphFetchOptions, GraphInput } from '#types/helpers'
export type { FindManyMeta, FindManyResult, GraphFetchOptions, GraphInput } from '#types/helpers'


/**
 * withGraphFetched 的 options：除标准 GraphOptions 外，Objection 还支持
 * 按关联名传入修饰（如 `{ goods: { orderBy: [...] } }`），该形态未在 SDK 类型中声明，
 * 用索引签名兜底描述这一动态边界。
 */



/**
 * 将数组形式的 Graph 输入转换为规范化的字符串形式
 *
 * 转换规则：
 * - 简单关系：`['a', 'b']` → `[a,b]`
 * - 嵌套关系：`['a.b', 'a.c']` → `[a.[b,c]]`（自动合并共享前缀）
 * - 混合关系：`['a', 'b.c']` → `[a,b.[c]]`（保持简单关系在前，嵌套在后）
 *
 * @param rels 关系数组
 * @returns 规范化后的 Graph 字符串
 */
function arrayToGraph(rels: string[]): string {
  if (!rels.length) return ''

  // 分类：简单关系 vs 嵌套关系（包含 '.'）
  const simple: string[] = []
  const nested: { prefix: string; suffixes: string[] }[] = []

  for (const rel of rels) {
    if (!rel) continue
    if (!rel.includes('.')) {
      simple.push(rel)
    } else {
      const parts = rel.split('.')
      const prefix = parts[0]
      const suffix = parts.slice(1).join('.')
      const existing = nested.find((n) => n.prefix === prefix)
      if (existing) {
        if (!existing.suffixes.includes(suffix)) {
          existing.suffixes.push(suffix)
        }
      } else {
        nested.push({ prefix, suffixes: [suffix] })
      }
    }
  }

  // 构建结果
  const parts: string[] = []

  // 添加简单关系
  parts.push(...simple)

  // 添加嵌套关系（格式：[prefix.[suffix1,suffix2,...]]）
  for (const n of nested) {
    if (n.suffixes.length === 1) {
      // 单个子关系，直接用 dot 语法
      parts.push(`${n.prefix}.${n.suffixes[0]}`)
    } else {
      // 多个子关系，使用嵌套语法
      parts.push(`${n.prefix}.[${n.suffixes.join(',')}]`)
    }
  }

  return `[${parts.join(',')}]`
}

/**
 * 规范化 Graph 输入
 *
 * @param graph 字符串或数组形式的 Graph 表达式
 * @returns 规范化后的 Graph 字符串，或 undefined（当输入为空时）
 *
 * @example
 * normalizeGraph('[a,b]')                  // → '[a,b]'
 * normalizeGraph(['a', 'b'])               // → '[a,b]'
 * normalizeGraph(['a.b', 'a.c'])           // → '[a.[b,c]]'
 * normalizeGraph(['items.good', 'items.x']) // → '[items.[good,x]]'
 * normalizeGraph(undefined)                // → undefined
 */
export function normalizeGraph(graph: GraphInput): string | undefined {
  if (!graph) return undefined

  if (Array.isArray(graph)) {
    const rels = graph.map((s) => String(s || '').trim()).filter(Boolean)
    if (!rels.length) return undefined
    return arrayToGraph(rels)
  }

  const g = String(graph).trim()
  return g.length ? g : undefined
}

export function wrapServiceError(service: string, action: string, err: unknown) {
  if (err && typeof err === 'object') {
    if (!(err as AppError).code) (err as AppError).code = `${service}.${action}`
    return err
  }
  const e = new Error(typeof err === 'string' ? err : 'Service error') as AppError
  e.code = `${service}.${action}`
  return e
}

export async function findOneWithGraph<M extends typeof BaseModel>(
  ModelClass: M,
  params: {
    filters: Record<string, unknown> | undefined
    trashed?: boolean
    graph?: GraphInput
    graphOptions?: GraphFetchOptions
  }
): Promise<InstanceType<M> | undefined> {
  const { filters, trashed = false, graph, graphOptions } = params
  const graphExpr = normalizeGraph(graph)
  // buildQuery 已在各 Model 内实现 deleted_at 过滤等逻辑
  // buildQuery 基类签名返回 QueryBuilder<BaseModel>，泛型调用时按 InstanceType<M> 收窄
  let query = ModelClass.buildQuery(ModelClass.query(), filters, trashed) as unknown as QueryBuilder<InstanceType<M>>
  if (graphExpr) query = query.withGraphFetched(graphExpr, graphOptions)
  return await query.first()
}

export async function findManyWithGraph<M extends typeof BaseModel>(
  ModelClass: M,
  params: {
    filters: Record<string, unknown> | undefined
    page: number
    pageSize: number
    order?: SortOrder
    trashed?: boolean
    graph?: GraphInput
    graphOptions?: GraphFetchOptions
  }
): Promise<FindManyResult<InstanceType<M>>> {
  const { filters, page, pageSize, order, trashed = false, graph, graphOptions } = params
  const graphExpr = normalizeGraph(graph)

  const offset = (page - 1) * pageSize
  const baseQuery = ModelClass.buildQuery(ModelClass.query(), filters, trashed) as unknown as QueryBuilder<InstanceType<M>>
  const total = await baseQuery.clone().resultSize()

  let dataQuery: QueryBuilder<InstanceType<M>> = baseQuery.clone()
  if (order) {
    // BaseModel.applyOrder 统一排序逻辑（含排序列白名单校验）
    ModelClass.applyOrder(dataQuery, order)
  }
  if (graphExpr) dataQuery = dataQuery.withGraphFetched(graphExpr, graphOptions)
  const data = await dataQuery.limit(pageSize).offset(offset)

  return {
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

export async function findAllWithGraph<M extends typeof BaseModel>(
  ModelClass: M,
  params: {
    filters: Record<string, unknown> | undefined
    order?: SortOrder
    trashed?: boolean
    graph?: GraphInput
    graphOptions?: GraphFetchOptions
  }
): Promise<Array<InstanceType<M>>> {
  const { filters, order, trashed = false, graph, graphOptions } = params
  const graphExpr = normalizeGraph(graph)

  let query = ModelClass.buildQuery(ModelClass.query(), filters, trashed) as unknown as QueryBuilder<InstanceType<M>>
  if (order) {
    ModelClass.applyOrder(query, order)
  }
  if (graphExpr) query = query.withGraphFetched(graphExpr, graphOptions)
  return await query
}
