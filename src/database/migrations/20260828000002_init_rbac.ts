/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/database/migrations/20260828000002_init_rbac.ts
 * @Description:
 * 框架级基础迁移（三）：roles/permissions/roles_permissions
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import type { Knex } from 'knex'

const prefix = config('database.prefix')

export async function up(knex: Knex): Promise<void> {
  // ======= roles.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}roles`, (table) => {
    table.increments('id').primary()
    table.string('name', 80).notNullable().comment('角色名称')
    table.json('permissions').nullable().comment('权限关键字')
    table.json('extension').nullable().comment('扩展信息')
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态：0禁用，1启用')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.dateTime('deleted_at').nullable()
    table.index(['status', 'deleted_at'], 'roles_status_deleted_at_index')
    table.comment('角色表')
  })

  // ======= permissions.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}permissions`, (table) => {
    table.increments('id').primary()
    table.string('key', 120).notNullable().comment('权限关键字')
    table.string('operation', 80).notNullable().comment('操作名称')
    table.json('extension').nullable().comment('扩展信息')
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态：0禁用，1启用')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.dateTime('deleted_at').nullable()
    table.unique(['key', 'operation'], 'permissions_key_operation_unique')
    table.index(['status', 'deleted_at'], 'permissions_status_deleted_at_index')
    table.comment('权限表')
  })

  // ======= roles_permissions.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}roles_permissions`, (table) => {
    table.increments('id').primary()
    table.integer('role_id').unsigned().notNullable().comment('角色编号')
    table.foreign('role_id').references('id').inTable(`${prefix}roles`).onDelete('CASCADE').onUpdate('CASCADE')
    table.integer('permission_id').unsigned().notNullable().comment('权限编号')
    table.foreign('permission_id').references('id').inTable(`${prefix}permissions`).onDelete('CASCADE').onUpdate('CASCADE')
    table.unique(['role_id', 'permission_id'], 'roles_permissions_role_permission_unique')
    table.comment('角色权限表')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(`${prefix}roles_permissions`)
  await knex.schema.dropTableIfExists(`${prefix}permissions`)
  await knex.schema.dropTableIfExists(`${prefix}roles`)
}
