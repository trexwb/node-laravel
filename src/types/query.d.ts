/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/types/query.d.ts
 * @Description:
 * 查询通用类型 — 排序参数等，供 Model / Service 层复用。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
/** 单个排序项（column 支持「表名.列名」前缀，order 支持 asc/desc 任意大小写） */
export interface SortOrderItem {
  column: string
  order?: string
}

/** 排序参数：单对象或对象数组 */
export type SortOrder = SortOrderItem | SortOrderItem[]
