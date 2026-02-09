/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:49:49
 * @FilePath: /node-laravel/src/app/Casts/CastInterface.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
export interface CastInterface {
  get(value: any): any;
  set(value: any): any;
}

export interface CacheDriver {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>; // ttl 单位：秒
  forget(key: string): Promise<void>;
  flush(): Promise<void>;
  forgetByPattern(pattern: string): Promise<void>;
}