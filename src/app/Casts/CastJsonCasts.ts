/*
 * @Author: trexwb
 * @Date: 2026-01-22
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-06
 * @FilePath: node-laravel/src/app/Casts/CastJsonCasts.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { CastInterface } from '#app/Interfaces/CastInterface'

export class CastJson implements CastInterface {
  get(value: unknown) {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as unknown
      } catch {
        return {}
      }
    }
    return value || {}
  }

  set(value: unknown) {
    return typeof value === 'string' ? value : JSON.stringify(value)
  }
}
