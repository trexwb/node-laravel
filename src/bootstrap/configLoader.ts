import app from '#config/app';
import database from '#config/database';
import * as _ from 'lodash-es';

const configs: Record<string, any> = {
  app,
  database
};

/**
 * 模拟 Laravel 的 config() 辅助函数
 * 支持小点语法获取配置，如: config('database.host')
 */
export function config(path: string, defaultValue: any = null) {
  return _.get(configs, path, defaultValue);
}