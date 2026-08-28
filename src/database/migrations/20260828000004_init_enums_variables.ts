/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/database/migrations/20260828000004_init_enums_variables.ts
 * @Description:
 * 框架级基础迁移（五）：enums/variables
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import type { Knex } from 'knex'

const prefix = config('database.prefix')

export async function up(knex: Knex): Promise<void> {
  // ======= enums.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}enums`, (table) => {
    table.increments('id').primary()
    table.string('key', 120).notNullable().comment('关键字')
    table.string('label', 255).notNullable().comment('名称')
    table.string('name', 120).notNullable().comment('值')
    table.integer('value').unsigned().notNullable().comment('枚举值')
    table.json('extension').nullable().comment('扩展信息')
    table.integer('sort').unsigned().defaultTo(0).comment('排序')
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态:0非默认，1默认')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.dateTime('deleted_at').nullable()
    table.index(['key', 'value'], 'enums_key_value_index')
    table.index(['status', 'sort'], 'enums_status_sort_index')
    table.comment('枚举值')
  })

  // ======= variables.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}variables`, (table) => {
    table.increments('id').primary()
    table.string('key', 120).notNullable().comment('关键字')
    table.json('value').nullable().comment('值')
    table.json('extension').nullable().comment('扩展信息')
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态:0禁用，1启用')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.dateTime('deleted_at').nullable()
    table.unique(['key'], 'variables_key_unique')
    table.index(['status', 'deleted_at'], 'variables_status_deleted_at_index')
    table.comment('变量')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(`${prefix}variables`)
  await knex.schema.dropTableIfExists(`${prefix}enums`)
}
