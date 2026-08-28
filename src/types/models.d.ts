/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/types/models.d.ts
 * @Description:
 * 模型层通用类型声明 — jsonSchema 结构类型与通用筛选值。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
/** jsonSchema.properties 中单字段的结构（仅读取，不暴露给外部） */
export type SchemaProp = {
  type?: string | string[]
  format?: string
  enum?: string[]
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  pattern?: string
  default?: unknown
  required?: string[]
  additionalProperties?: boolean | SchemaProp
  items?: SchemaProp
  properties?: Record<string, SchemaProp>
}

export type SchemaProps = Record<string, SchemaProp>

/**
 * 通用筛选值类型：applyCondition / apply 中传给 knex where/whereIn 的值。
 * 覆盖标量与数组两种常见过滤形态；null 表示「不传值」。
 */
export type FilterValue = string | number | boolean | string[] | number[] | null

/**
 * 运算符式过滤条件（如 { id: { eq: 1, not: 2 } }）。
 * 用于 buildQuery 对 id 字段的「等于 / 不等于」二态过滤。
 */
export interface FilterCondition {
  eq?: FilterValue
  not?: FilterValue
}
