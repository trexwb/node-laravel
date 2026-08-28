/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/database/migrations/20260828000001_init_logs_servers.ts
 * @Description:
 * 框架级基础迁移（二）：servers/clients_logs/system_logs/languages
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import type { Knex } from 'knex'

const prefix = config<string>('database.prefix')

export async function up(knex: Knex): Promise<void> {
  // ======= servers.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}servers`, (table) => {
    table.increments('id').primary()
    table.string('name', 40).notNullable().comment('服务名称')
    table.string('url', 255).notNullable().comment('服务地址')
    table.string('key', 40).notNullable().comment('服务关键词')
    table.string('app_id', 40).notNullable().comment('服务appid')
    table.string('app_secret', 40).notNullable().comment('服务密钥')
    table.string('app_iv', 40).notNullable().comment('密钥向量')
    table.json('extension').nullable().comment('配置扩展')
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态：0禁用，1启用')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.dateTime('deleted_at').nullable()
    table.unique(['key'], 'servers_key_unique')
    table.unique(['app_id'], 'servers_app_id_unique')
    table.unique(['url'], 'servers_url_unique')
    table.index(['status', 'deleted_at'], 'servers_status_deleted_at_index')
    table.comment('微服务')
  })

  // ======= servers_logs.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}servers_logs`, (table) => {
    table.bigIncrements('id').primary()
    table.integer('server_id').unsigned().notNullable().comment('服务编号')
    table.foreign('server_id').references('id').inTable(`${prefix}servers`).onDelete('CASCADE').onUpdate('CASCADE')
    table.json('source').nullable().comment('操作前')
    table.json('handle').nullable().comment('操作内容')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.index(['server_id', 'created_at'], 'servers_logs_server_created_at_index')
    table.comment('微服务变更记录')
  })

  // ======= clients_logs.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}clients_logs`, (table) => {
    table.bigIncrements('id').primary()
    table.json('client').nullable().comment('客户端信息')
    table.string('url', 255).notNullable().comment('接口地址')
    table.string('operation', 120).notNullable().comment('操作内容')
    table.json('request').nullable().comment('请求数据')
    table.json('result').nullable().comment('请求结果')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.index(['url'], 'clients_logs_url_index')
    table.index(['operation'], 'clients_logs_operation_index')
    table.index(['created_at'], 'clients_logs_created_at_index')
    table.comment('客户端调用日志')
  })

  // ======= system_logs.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}system_logs`, (table) => {
    table.bigIncrements('id').primary()
    table.json('user').nullable().comment('账号信息')
    table.string('url', 255).notNullable().comment('接口地址')
    table.string('operation', 120).notNullable().comment('操作内容')
    table.json('request').nullable().comment('请求数据')
    table.json('result').nullable().comment('请求结果')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.index(['url'], 'system_logs_url_index')
    table.index(['operation'], 'system_logs_operation_index')
    table.index(['created_at'], 'system_logs_created_at_index')
    table.comment('系统操作日志')
  })

  // ======= languages.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}languages`, (table) => {
    table.increments('id').primary()
    table.string('name', 80).notNullable().comment('语言名称')
    table.string('code', 40).notNullable().comment('标识代码')
    table.string('abbreviation', 40).notNullable().comment('缩写')
    table.string('icon', 255).nullable().comment('图标')
    table.json('extension').nullable().comment('配置扩展')
    table.integer('sort').unsigned().defaultTo(0).comment('排序')
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态:0非默认，1默认')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.dateTime('deleted_at').nullable()
    table.unique(['code'], 'languages_code_unique')
    table.index(['status', 'sort'], 'languages_status_sort_index')
    table.comment('多语言设置')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(`${prefix}languages`)
  await knex.schema.dropTableIfExists(`${prefix}system_logs`)
  await knex.schema.dropTableIfExists(`${prefix}clients_logs`)
  await knex.schema.dropTableIfExists(`${prefix}servers_logs`)
  await knex.schema.dropTableIfExists(`${prefix}servers`)
}
