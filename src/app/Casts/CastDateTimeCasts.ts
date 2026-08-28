/*
 * @Author: trexwb
 * @Date: 2026-01-22 11:07:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-09 10:31:17
 * @FilePath: /stl/server/src/app/Casts/CastDateTime.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { CastInterface } from '#app/Interfaces/CastInterface'
import dayjs from '#app/Helpers/format'
import type { CastDateTimeOptions, DayjsInput } from '#types/casts'
export type { CastDateTimeOptions } from '#types/casts'


/** dayjs 可接受的日期输入类型（cast 输入为 unknown，读取时需收窄） */

export class CastDateTime implements CastInterface {
  constructor(private options: CastDateTimeOptions = {}) {}

  get(value: unknown) {
    if (!value) return null
    const tz = this.options.timezone
    const date = tz ? dayjs.tz(value as DayjsInput, tz) : dayjs(value as DayjsInput)
    return this.options.format ? date.format(this.options.format) : date // 默认返回 dayjs 实例
  }

  set(value: unknown) {
    if (!value) return null
    const date = dayjs(value as DayjsInput)
    // 存 UTC（推荐）
    if (this.options.storeAsUtc !== false) {
      return date.utc().format('YYYY-MM-DD HH:mm:ss')
    }
    // 原样存（极少用）
    return date.format('YYYY-MM-DD HH:mm:ss')
  }
}
