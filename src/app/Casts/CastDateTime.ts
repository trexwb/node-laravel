/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:49:43
 * @FilePath: /node-laravel/src/app/Casts/CastDateTime.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import dayjs from '#app/Helpers/Format';
import type { CastInterface } from '#app/Casts/CastInterface';

export interface CastDateTimeOptions {
  timezone?: string;          // 返回时区
  format?: string;            // 返回格式
  storeAsUtc?: boolean;       // 是否存 UTC（默认 true）
}

export class CastDateTime implements CastInterface {
  constructor(
    private options: CastDateTimeOptions = {}
  ) { }

  get(value: any) {
    if (!value) return null;
    const tz = this.options.timezone;
    const date = tz ? dayjs.tz(value, tz) : dayjs(value);
    return this.options.format ? date.format(this.options.format) : date; // 默认返回 dayjs 实例
  }

  set(value: any) {
    if (!value) return null;
    const date = dayjs(value);
    // 存 UTC（推荐）
    if (this.options.storeAsUtc !== false) {
      return date.utc().format('YYYY-MM-DD HH:mm:ss');
    }
    // 原样存（极少用）
    return date.format('YYYY-MM-DD HH:mm:ss');
  }
}
