/**
 * 字段转换类型声明 — CastDateTime 等 Cast 实现共用。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

/** CastDateTime 构造选项 */
export interface CastDateTimeOptions {
  timezone?: string // 返回时区
  format?: string // 返回格式
  storeAsUtc?: boolean // 是否存 UTC（默认 true）
}

/** dayjs 输入类型 */
export type DayjsInput = string | number | Date
