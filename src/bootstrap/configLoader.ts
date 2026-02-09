/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:57:13
 * @FilePath: /node-laravel/src/bootstrap/configLoader.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import app from '#config/app';
import database from '#config/database';
import cache from '#config/cache';
import * as _ from 'lodash-es';

const configs: Record<string, any> = {
  app,
  database,
  cache
};

/**
 * 模拟 Laravel 的 config() 辅助函数
 * 支持小点语法获取配置，如: config('database.host')
 */
export function config(path: string, defaultValue: any = null) {
  return _.get(configs, path, defaultValue);
}