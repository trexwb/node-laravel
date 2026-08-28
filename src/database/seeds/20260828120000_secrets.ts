/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/database/seeds/20260828120000_secrets.ts
 * @Description:
 * 框架级种子：初始化网关密钥（演示）
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import Utils from '#utils/index'
import type { Knex } from 'knex'
import path from 'node:path'
import { fileURLToPath } from 'url'

export async function seed(knex: Knex): Promise<void> {
  const __filename = fileURLToPath(import.meta.url)
  const seedFileName = path.basename(__filename, path.extname(__filename))
  const prefix = config('database.prefix')

  // 1. 检查是否已运行过
  const hasRun = await knex(`${prefix}seeds`).where({ name: seedFileName }).first()
  if (hasRun) return

  // 2. 检查数据是否存在
  const countRes = await knex(`${prefix}secrets`).count('id', { as: 'total' }).first()
  const total = Number(countRes?.total || 0)

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
      updated_at: knex.fn.now(),
    }
    await knex(`${prefix}secrets`).insert(secretsData)
    console.log('超管网关密钥已初始化成功（演示数据）')
    console.table({ title: secretsData.title, app_id: secretsData.app_id, app_secret: secretsData.app_secret, app_iv: secretsData.app_iv, permissions: secretsData.permissions })
    // 3. 记录运行历史
    await knex(`${prefix}seeds`).insert({
      name: seedFileName,
      batch: 1,
      migration_time: knex.fn.now(),
    })
  }
}
