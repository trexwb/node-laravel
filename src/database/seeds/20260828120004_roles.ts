/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/database/seeds/20260828120004_roles.ts
 * @Description:
 * 框架级种子：默认角色（超级管理员/管理员）并绑定权限
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import type { Knex } from 'knex'
import path from 'node:path'
import { fileURLToPath } from 'url'

export async function seed(knex: Knex): Promise<void> {
  const __filename = fileURLToPath(import.meta.url)
  const seedFilePath = path.basename(__filename, path.extname(__filename))
  const prefix = config('database.prefix')
  return await knex(`${prefix}seeds`)
    .where({ name: seedFilePath })
    .first()
    .then(async (row) => {
      if (row) return Promise.resolve()
      const total = await knex
        .from(`${prefix}roles`)
        .count('id', { as: 'total' })
        .first()
        .then((row) => {
          return row.total || 0
        })
        .catch(() => {
          return 0
        })
      if (total === 0) {
        // 框架级系统通用权限（与 permissions 种子保持一致，不含业务模块）
        const rootPermissions: string[] = [
          'secrets',
          'schedules',
          'jobs',
          'seeds',
          'configs',
          'servers',
          'languages',
          'permissions',
          'roles',
          'users',
          'variables',
          'enums',
          'statistics',
          'cache',
          'trash',
        ]
        const adminPermissions: string[] = [
          'secrets',
          'schedules',
          'jobs',
          'seeds',
          'configs',
          'servers',
          'languages',
          'permissions',
          'roles',
          'users',
          'variables',
          'enums',
          'statistics',
        ]
        await knex(`${prefix}roles`).insert([
          {
            id: 1,
            name: '超级管理员',
            permissions: JSON.stringify(rootPermissions) || '[]',
            extension: null,
            status: 1,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
          },
          {
            id: 2,
            name: '管理员',
            permissions: JSON.stringify(adminPermissions) || '[]',
            extension: null,
            status: 1,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
          },
        ])
        await knex(`${prefix}roles_permissions`).del()
        const rows = await knex
          .from(`${prefix}roles`)
          .then((rows) => {
            return Array.isArray(rows) ? rows : []
          })
          .catch(() => {
            return []
          })

        await Promise.all(
          rows.map(async (row) => {
            const result = await knex(`${prefix}permissions`).select('id').whereIn('key', row.permissions || [])
            const data = result.map((item) => ({
              role_id: row.id,
              permission_id: item.id,
            }))
            if (data.length > 0) {
              await knex(`${prefix}roles_permissions`).insert(data)
            }
          })
        )
        return await knex(`${prefix}seeds`).insert([
          {
            name: seedFilePath,
            batch: 1,
            migration_time: knex.fn.now(),
          },
        ])
      }
    })
}
