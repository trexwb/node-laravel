/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/database/migrations/20260828000003_init_users.ts
 * @Description:
 * 框架级基础迁移（四）：users/users_roles/users_logs
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import type { Knex } from 'knex'

const prefix = config<string>('database.prefix')

export async function up(knex: Knex): Promise<void> {
  // ======= users.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}users`, (table) => {
    table.increments('id').primary()
    table.string('nickname', 80).notNullable().comment('昵称')
    table.string('email', 120).nullable().comment('邮箱')
    table.string('mobile', 20).nullable().comment('手机号')
    table.string('avatar', 255).nullable().comment('头像')
    table.string('password', 255).notNullable().comment('密码')
    table.string('salt', 10).nullable().comment('随机数')
    table.string('remember_token', 100).nullable().comment('记住登录')
    table.string('uuid', 60).nullable().comment('唯一标识')
    table.string('secret', 100).nullable().comment('密钥')
    table.json('extension').nullable().comment('扩展信息')
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态:0禁用，1启用')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.dateTime('deleted_at').nullable()
    table.index(['email', 'deleted_at'], 'users_email_deleted_at_index')
    table.index(['mobile', 'deleted_at'], 'users_mobile_deleted_at_index')
    table.index(['uuid'], 'users_uuid_index')
    table.index(['status', 'deleted_at'], 'users_status_deleted_at_index')
    table.comment('用户')
  })

  // ======= users_roles.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}users_roles`, (table) => {
    table.increments('id').primary()
    table.integer('user_id').unsigned().notNullable().comment('用户编号')
    table.foreign('user_id').references('id').inTable(`${prefix}users`).onDelete('CASCADE').onUpdate('CASCADE')
    table.integer('role_id').unsigned().notNullable().comment('角色编号')
    table.foreign('role_id').references('id').inTable(`${prefix}roles`).onDelete('CASCADE').onUpdate('CASCADE')
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态:0禁用，1启用')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.index(['user_id', 'role_id'], 'users_roles_user_role_index')
    table.comment('用户角色表')
  })

  // ======= users_logs.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}users_logs`, (table) => {
    table.bigIncrements('id').primary()
    table.integer('user_id').unsigned().notNullable().comment('用户编号')
    table.foreign('user_id').references('id').inTable(`${prefix}users`).onDelete('CASCADE').onUpdate('CASCADE')
    table.json('source').nullable().comment('操作前')
    table.json('handle').nullable().comment('操作内容')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.index(['user_id', 'created_at'], 'users_logs_user_created_at_index')
    table.comment('用户变更记录')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(`${prefix}users_logs`)
  await knex.schema.dropTableIfExists(`${prefix}users_roles`)
  await knex.schema.dropTableIfExists(`${prefix}users`)
}
