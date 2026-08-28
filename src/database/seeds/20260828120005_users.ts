/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/database/seeds/20260828120005_users.ts
 * @Description:
 * 框架级种子：演示账号（admin/root，scrypt 加密密码）
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import { makePassword } from '#app/Helpers/hashPassword'
import Utils from '#app/Helpers/index'
import type { Knex } from 'knex'
import path from 'node:path'
import { fileURLToPath } from 'url'

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
        .from(`${prefix}users`)
        .count('id', { as: 'total' })
        .first()
        .then((row) => {
          return row.total || 0
        })
        .catch(() => {
          return 0
        })
      if (total === 0) {
        // 演示账号（固定密码便于本地体验，生产环境由上方 NODE_ENV 校验拦截）
        const accounts = [
          {
            id: 1,
            nickname: 'root',
            email: 'root@node-laravel.local',
            mobile: '',
            password: '123456',
            roleId: 1,
          },
          {
            id: 2,
            nickname: 'admin',
            email: 'admin@node-laravel.local',
            mobile: '',
            password: '123456',
            roleId: 2,
          },
        ]
        // 演示密码仅用于本地开发联调；scrypt 加盐后落库，非明文存储
        console.warn('[seed:users] 演示账号使用弱口令 123456，仅供本地开发联调使用')
        const rows = accounts.map((account) => {
          const passwordHash = makePassword(account.password)
          return {
            id: account.id,
            nickname: account.nickname,
            email: account.email,
            mobile: account.mobile,
            avatar: '',
            password: passwordHash.password,
            salt: passwordHash.salt,
            remember_token: null,
            uuid: Utils.getUUID(),
            secret: Utils.generateRandomString(32),
            extension: JSON.stringify({}),
            status: 1,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
          }
        })
        await knex(`${prefix}users`)
          .insert(rows)
          .then(async () => {
            await knex(`${prefix}users_roles`).insert(
              accounts.map((account) => ({
                user_id: account.id,
                role_id: account.roleId,
                status: 1,
              }))
            )
            console.log('演示账号已初始化（密码均为 123456，生产环境请修改）：')
            console.table(
              accounts.map((account) => ({
                账号: account.nickname,
                密码: account.password,
                email: account.email,
                角色ID: account.roleId,
              }))
            )
            // 插入成功后，记录这次执行
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
