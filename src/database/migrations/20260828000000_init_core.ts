/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/database/migrations/20260828000000_init_core.ts
 * @Description:
 * 框架级基础迁移（一）：secrets/schedules/jobs/seeds/configs
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import type { Knex } from 'knex'

const prefix = config('database.prefix')

export async function up(knex: Knex): Promise<void> {
  // ======= secrets.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}secrets`, (table) => {
    table.increments('id').primary()
    table.string('title', 120).notNullable().comment('密钥主体')
    table.string('app_id', 40).notNullable().comment('appid')
    table.string('app_secret', 40).notNullable().comment('密钥')
    table.string('app_iv', 40).notNullable().comment('密钥向量')
    table.json('permissions').nullable().comment('服务权限')
    table.dateTime('times_expire').nullable().comment('有效期')
    table.json('extension').nullable().comment('扩展信息')
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态：0禁用，1启用')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.dateTime('deleted_at').nullable()
    table.unique(['app_id'], 'secrets_app_id_unique')
    table.index(['status', 'deleted_at'], 'secrets_status_deleted_at_index')
    table.index(['times_expire'], 'secrets_times_expire_index')
    table.comment('API访问密钥')
  })

  // ======= secrets_logs.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}secrets_logs`, (table) => {
    table.bigIncrements('id').primary()
    table.integer('secret_id').unsigned().notNullable().comment('密钥编号')
    table.foreign('secret_id').references('id').inTable(`${prefix}secrets`).onDelete('CASCADE').onUpdate('CASCADE')
    table.json('source').nullable().comment('源数据')
    table.json('handle').nullable().comment('操作内容')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.index(['secret_id', 'created_at'], 'secrets_logs_secret_created_at_index')
    table.comment('密钥变更记录')
  })

  // ======= schedules.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}schedules`, (table) => {
    table.increments('id').primary()
    table.string('name', 120).notNullable().comment('任务名称')
    table.string('description').notNullable().comment('任务简介说明')
    table.string('time', 120).notNullable().comment('执行时间')
    table.json('handler').nullable().comment('执行内容')
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态:0非默认，1默认')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.dateTime('deleted_at').nullable()
    table.unique(['name'], 'schedules_name_unique')
    table.index(['status', 'deleted_at'], 'schedules_status_deleted_at_index')
    table.comment('计划任务')
  })

  // ======= schedules_logs.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}schedules_logs`, (table) => {
    table.bigIncrements('id').primary()
    table.integer('schedule_id').unsigned().notNullable().comment('任务编号')
    table.foreign('schedule_id').references('id').inTable(`${prefix}schedules`).onDelete('CASCADE').onUpdate('CASCADE')
    table.json('source').nullable().comment('源数据')
    table.json('handle').nullable().comment('操作内容')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.index(['schedule_id', 'created_at'], 'schedules_logs_schedule_created_at_index')
    table.comment('计划任务变更记录')
  })

  // ======= jobs.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}jobs`, (table) => {
    table.increments('id').primary()
    table.string('queue', 80).notNullable().defaultTo('default').comment('队列名')
    table.json('payload').comment('存储 Job 类名和参数 (JSON)')
    table.integer('attempts').unsigned().defaultTo(0).comment('已尝试次数')
    table.dateTime('reserved_at').nullable().comment('锁定时间（防止重复消费）')
    table.dateTime('available_at').nullable().comment('计划执行时间')
    table.dateTime('finished_at').nullable().comment('完成时间')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.index(['queue', 'finished_at', 'available_at'], 'jobs_queue_finished_available_index')
    table.index(['queue', 'reserved_at'], 'jobs_queue_reserved_at_index')
    table.comment('队列')
  })

  // ======= seeds.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}seeds`, (table) => {
    table.increments('id').primary()
    table.string('name', 200).notNullable().comment('种子文件名或标识符')
    table.integer('batch').unsigned().notNullable().defaultTo(1).comment('批次号')
    table.dateTime('migration_time').nullable()
    table.unique(['name'], 'seeds_name_unique')
    table.index(['batch'], 'seeds_batch_index')
    table.comment('种子数据执行')
  })

  // ======= configs.ts =======
  await knex.schema.createTableIfNotExists(`${prefix}configs`, (table) => {
    table.increments('id').primary()
    table.string('key', 120).notNullable().comment('关键字')
    table.json('value').nullable().comment('值')
    table.specificType('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    table.dateTime('created_at').defaultTo(knex.fn.now())
    table.dateTime('deleted_at').nullable()
    table.unique(['key'], 'configs_key_unique')
    table.index(['deleted_at'], 'configs_deleted_at_index')
    table.comment('基础配置')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(`${prefix}configs`)
  await knex.schema.dropTableIfExists(`${prefix}seeds`)
  await knex.schema.dropTableIfExists(`${prefix}jobs`)
  await knex.schema.dropTableIfExists(`${prefix}schedules_logs`)
  await knex.schema.dropTableIfExists(`${prefix}schedules`)
  await knex.schema.dropTableIfExists(`${prefix}secrets_logs`)
  await knex.schema.dropTableIfExists(`${prefix}secrets`)
}
