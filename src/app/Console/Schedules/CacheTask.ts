/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:50:16
 * @FilePath: /node-laravel/src/app/Console/Schedules/CacheTask.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import { CacheService } from '#app/Services/Cache/CacheService';

export default async function () {
  console.log('[CacheTask]定时任务执行时间:', new Date());
  await CacheService.flush();
}