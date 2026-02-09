/*
 * @Author: trexwb
 * @Date: 2026-02-05 17:51:51
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:58:31
 * @FilePath: /node-laravel/src/database/migrations/20260121054110_servers_logs.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Knex } from "knex";
import { config } from '#bootstrap/configLoader';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${config('database.prefix')}servers_logs`, (table) => {
    table.bigIncrements('id').primary(); // 自增ID
    table.integer('server_id').unsigned().comment('服务编号');
    table.foreign('server_id').references('id').inTable(`${config('database.prefix')}servers`).onDelete('CASCADE').onUpdate('CASCADE');
    table.json('source').nullable().comment('操作前');
    table.json('handle').nullable().comment('操作内容');
    table.specificType('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.comment('微服务变更记录');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${config('database.prefix')}servers_logs`);
}