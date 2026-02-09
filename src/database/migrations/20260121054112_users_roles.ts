/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:58:50
 * @FilePath: /node-laravel/src/database/migrations/20260121054112_users_roles.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Knex } from "knex";
import { config } from '#bootstrap/configLoader';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${config('database.prefix')}users_roles`, (table) => {
    table.integer('user_id').unsigned().comment('用户编号');
    table.foreign('user_id').references('id').inTable(`${config('database.prefix')}users`).onDelete('CASCADE').onUpdate('CASCADE');
    table.integer('role_id').unsigned().comment('角色编号');
    table.foreign('role_id').references('id').inTable(`${config('database.prefix')}roles`).onDelete('CASCADE').onUpdate('CASCADE');
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态:0禁用,1启用');
    table.comment('用户角色关系');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${config('database.prefix')}users_roles`);
}