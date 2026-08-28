/**
 * 查询通用类型 — 排序参数等，供 Model / Service 层复用。
 */

/** 单个排序项（column 支持「表名.列名」前缀，order 支持 asc/desc 任意大小写） */
export interface SortOrderItem {
  column: string
  order?: string
}

/** 排序参数：单对象或对象数组 */
export type SortOrder = SortOrderItem | SortOrderItem[]
