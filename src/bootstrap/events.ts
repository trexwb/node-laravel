/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:57:16
 * @FilePath: /node-laravel/src/bootstrap/events.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import { EventEmitter } from 'node:events';

// 创建全局事件总线
export const eventBus = new EventEmitter();