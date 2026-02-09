/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:49:52
 * @FilePath: /node-laravel/src/app/Casts/CastJson.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { CastInterface } from '#app/Casts/CastInterface';

export class CastJson implements CastInterface {
  get(value: any) {
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return {}; }
    }
    return value || {};
  }

  set(value: any) {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
}