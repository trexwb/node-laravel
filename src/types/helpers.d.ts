/**
 * 辅助层类型声明 — Helpers 目录各辅助函数的参数与返回类型。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { GraphOptions } from 'objection'

// ─── TreeBuilderHelper ───────────────────────────────────────────────

/** 树节点 */
export interface TreeNode {
  id: number
  parentId: number | null
  sort?: number
  children: TreeNode[]
  [key: string]: unknown
}

/** 建树配置 */
export interface BuildTreeOptions {
  /** 主键字段名，默认 'id' */
  idKey?: string
  /** 父节点字段名，默认 'parentId' */
  parentKey?: string
  /** 排序字段名，默认 'sort' */
  sortKey?: string
  /** 根节点判断值，默认 null */
  rootValue?: number | null
  /** 子节点数组字段名，默认 'children' */
  childrenKey?: string
}

/** 树条目（含 children） */
export type TreeItem<T> = T & { children: TreeItem<T>[] }

// ─── string ────────────────────────────────────────────────────

/** 脱敏/清洗选项 */
export interface SanitizeOptions {
  /** 需要移除的字段列表 */
  fields?: string[]
  /** 是否递归处理嵌套对象 */
  recursive?: boolean
}

// ─── query ─────────────────────────────────────────────────────

/** 排序配置 */
export interface SortConfig {
  column: string
  order: 'ASC' | 'DESC'
}

/** 分页配置 */
export interface PaginationConfig {
  page: number
  pageSize: number
}

// ─── ControllerHelper ────────────────────────────────────────────────

/** 控制器错误包装形状 */
export interface WrappedControllerError extends Error {
  code: string
  originalError?: unknown
}

// ─── WechatAuthorizeHelper ───────────────────────────────────────────

/** validateState 返回结果 */
export type ValidateStateResult = { ok: true } | { ok: true; uuid: string } | { ok: false; message: string }

// ─── OrmGraphHelper ──────────────────────────────────────────────────

/** 图查询输入 */
export type GraphInput = string | string[] | undefined

/**
 * withGraphFetched 的 options：除标准 GraphOptions 外，Objection 还支持
 * 按关联名传入修饰（如 `{ goods: { orderBy: [...] } }`），该形态未在 SDK 类型中声明，
 * 用索引签名兜底描述这一动态边界。
 */
export type GraphFetchOptions = GraphOptions | (GraphOptions & Record<string, unknown>)

/** 分页元信息 */
export type FindManyMeta = {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 分页查询结果 */
export type FindManyResult<T> = {
  data: T[]
  meta: FindManyMeta
}
