/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:58:21
 * @FilePath: /node-laravel/src/database/migrations/20260121054108_roles_permissions.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Knex } from "knex";
import { config } from '#bootstrap/configLoader';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${config('database.prefix')}roles_permissions`, (table) => {
    table.integer('role_id').unsigned().comment('角色编号');
    table.foreign('role_id').references('id').inTable(`${config('database.prefix')}roles`).onDelete('CASCADE').onUpdate('CASCADE');
    table.integer('permission_id').unsigned().comment('权限编号');
    table.foreign('permission_id').references('id').inTable(`${config('database.prefix')}permissions`).onDelete('CASCADE').onUpdate('CASCADE');
    table.comment('角色权限关系');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${config('database.prefix')}roles_permissions`);
}