/*
 * @Author: trexwb
 * @Date: 2026-01-22
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-09
 * @FilePath: node-laravel/src/app/Casts/CastBooleanCasts.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { CastInterface } from '#app/Interfaces/CastInterface'
export class CastBoolean implements CastInterface {
  get(value: unknown) {
    return Boolean(value)
  }
  set(value: unknown) {
    return value ? 1 : 0
  }
}
