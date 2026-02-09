/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:58:04
 * @FilePath: /node-laravel/src/database/migrations/20260121054104_jobs.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Knex } from "knex";
import { config } from '#bootstrap/configLoader';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${config('database.prefix')}jobs`, (table) => {
    table.bigIncrements('id').primary();
    table.string('queue').index().defaultTo('default').comment('队列名');
    table.json('payload').comment('存储 Job 类名和参数 (JSON)');
    table.integer('attempts').defaultTo(0).comment('已尝试次数');
    table.timestamp('reserved_at').nullable().comment('锁定时间（防止重复消费）');
    table.timestamp('available_at').index().comment('计划执行时间');
    table.timestamp('finished_at').nullable().comment('完成时间');
    table.specificType('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.comment('队列');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${config('database.prefix')}jobs`);
}