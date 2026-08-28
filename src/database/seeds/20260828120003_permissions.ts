/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/database/seeds/20260828120003_permissions.ts
 * @Description:
 * 框架级种子：基础权限（仅框架级系统通用权限，不含业务）
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import type { Knex } from 'knex'
import path from 'node:path'
import { fileURLToPath } from 'url'

interface PermissionObject {
  id: null
  key: string
  operation: string
  extension: null
  status: number
  created_at: Knex.Raw
  updated_at: Knex.Raw
  deleted_at: null
}

export async function seed(knex: Knex): Promise<void> {
  const __filename = fileURLToPath(import.meta.url)
  const seedFilePath = path.basename(__filename, path.extname(__filename))
  const prefix = config<string>('database.prefix')
  return await knex(`${prefix}seeds`)
    .where({ name: seedFilePath })
    .first()
    .then(async (row) => {
      if (row) return Promise.resolve()
      const total = await knex
        .from(`${prefix}permissions`)
        .count('id', { as: 'total' })
        .first()
        .then((row) => {
          return row.total || 0
        })
        .catch(() => {
          return 0
        })
      if (total === 0) {
        // 框架级系统通用权限（不含任何业务模块）
        const permissions = [
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
        const permissionObjects: PermissionObject[] = []
        permissions.forEach((permission) => {
          if (permission.includes('trash')) {
            ;['read', 'restore', 'delete'].forEach((action) => {
              permissionObjects.push({
                id: null,
                key: permission,
                operation: action,
                extension: null,
                status: 1,
                created_at: knex.fn.now(),
                updated_at: knex.fn.now(),
                deleted_at: null,
              })
            })
          } else if (['cache'].includes(permission)) {
            ;['read', 'delete'].forEach((action) => {
              permissionObjects.push({
                id: null,
                key: permission,
                operation: action,
                extension: null,
                status: 1,
                created_at: knex.fn.now(),
                updated_at: knex.fn.now(),
                deleted_at: null,
              })
            })
          } else if (['users'].includes(permission)) {
            ;['read', 'write', 'delete', 'impersonate'].forEach((action) => {
              permissionObjects.push({
                id: null,
                key: permission,
                operation: action,
                extension: null,
                status: 1,
                created_at: knex.fn.now(),
                updated_at: knex.fn.now(),
                deleted_at: null,
              })
            })
          } else {
            ;['read', 'write', 'delete'].forEach((action) => {
              permissionObjects.push({
                id: null,
                key: permission,
                operation: action,
                extension: null,
                status: 1,
                created_at: knex.fn.now(),
                updated_at: knex.fn.now(),
                deleted_at: null,
              })
            })
          }
        })
        await knex(`${prefix}permissions`)
          .insert(permissionObjects)
          .then(async () => {
            return await knex(`${prefix}seeds`).insert([
              {
                name: seedFilePath,
                batch: 1,
                migration_time: knex.fn.now(),
              },
            ])
          })
      }
    })
}
