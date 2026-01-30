import fs from 'fs';
import path from 'path';
import Utils from '#utils/index';
import type { Knex } from 'knex';
import { fileURLToPath } from 'url';
import { config } from '#bootstrap/configLoader';

export async function seed(knex: Knex): Promise<void> {
  const __filename = fileURLToPath(import.meta.url);
  const seedFileName = path.basename(__filename, path.extname(__filename));
  const prefix = config('database.prefix');

  // 1. 检查是否已运行过
  const hasRun = await knex(`${prefix}seeds`).where({ name: seedFileName }).first();
  if (hasRun) return;

  // 2. 检查数据是否存在
  const countRes = await knex(`${prefix}secrets`).count('id as total').first();
  const total = Number(countRes?.total || 0);

  if (total === 0) {
    const secretsData = {
      title: '网关',
      app_id: Utils.unique(16).toString(),
      app_secret: Utils.generateRandomString(32),
      app_iv: Utils.generateRandomString(16),
      permissions: JSON.stringify(['admin']),
      extension: JSON.stringify({}),
      status: 1,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    };
    await knex(`${prefix}secrets`).insert(secretsData);
    // 写入临时安装文件 (用于后续安装引导程序)
    const rootPath = path.resolve(path.dirname(__filename), '../../../../');
    const tempFilePath = path.join(rootPath, 'temp_install.json');
    const secretsJson = {
      'appId': secretsData.app_id,
      'appSecret': secretsData.app_secret,
      'appIv': secretsData.app_iv
    };
    let jsonData = {};
    try {
      jsonData = JSON.parse(fs.readFileSync(tempFilePath, 'utf8'));
    } catch (error) {
      jsonData = {};
    }
    jsonData = {
      ...jsonData,
      secrets: secretsJson
    };
    fs.writeFileSync(tempFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
    // ... 原有的文件写入逻辑 (建议使用 fs.promises 保持异步)
    // 3. 记录运行历史
    await knex(`${prefix}seeds`).insert({
      name: seedFileName,
      batch: 1,
      migration_time: knex.fn.now()
    });
  }
}