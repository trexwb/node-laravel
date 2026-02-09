/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:58:06
 * @FilePath: /node-laravel/src/database/migrations/20260121054105_seeds.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Knex } from "knex";
import { config } from '#bootstrap/configLoader';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${config('database.prefix')}seeds`, (table) => {
    table.increments('id').primary(); // 自增ID
    table.string('name').notNullable().comment('种子文件名或标识符');
    table.integer('batch').unsigned().comment('批次号');
    table.timestamp('migration_time').nullable();
    table.comment('种子数据执行');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${config('database.prefix')}seeds`);
}