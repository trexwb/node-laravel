/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/database/seeds/20260828120002_jobs.ts
 * @Description:
 * 框架级种子：队列任务（空，由各业务项目动态入队）
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import type { Knex } from 'knex'
import path from 'node:path'
import { fileURLToPath } from 'url'

export async function seed(knex: Knex): Promise<void> {
  const __filename = fileURLToPath(import.meta.url)
  const seedFileName = path.basename(__filename, path.extname(__filename))
  const prefix = config<string>('database.prefix')

  // 1. 检查是否已运行过
  const hasRun = await knex(`${prefix}seeds`).where({ name: seedFileName }).first()
  if (hasRun) return

  // 2. 框架级不预置任何队列任务，由各业务项目在运行时按需入队

  // 3. 记录运行历史
  await knex(`${prefix}seeds`).insert({
    name: seedFileName,
    batch: 1,
    migration_time: knex.fn.now(),
  })
}
