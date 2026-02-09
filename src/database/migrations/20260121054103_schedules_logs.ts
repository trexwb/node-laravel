/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:58:00
 * @FilePath: /node-laravel/src/database/migrations/20260121054103_schedules_logs.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Knex } from "knex";
import { config } from '#bootstrap/configLoader';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${config('database.prefix')}schedules_logs`, (table) => {
    table.increments('id').primary(); // 自增ID
    table.integer('schedule_id').unsigned().comment('密钥编号');
    table.foreign('schedule_id').references('id').inTable(`${config('database.prefix')}schedules`).onDelete('CASCADE').onUpdate('CASCADE');
    table.json('source').nullable().comment('源数据');
    table.json('handle').nullable().comment('操作内容');
    table.specificType('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.comment('密钥变更记');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${config('database.prefix')}schedules_logs`);
}