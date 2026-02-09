/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:58:44
 * @FilePath: /node-laravel/src/database/migrations/20260121054111_users.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Knex } from "knex";
import { config } from '#bootstrap/configLoader';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${config('database.prefix')}users`, (table) => {
    table.increments('id');
    table.string('nickname', 40).notNullable().comment('昵称');
    table.string('email').notNullable().comment('账号邮箱');
    table.string('mobile').notNullable().comment('账号手机等');
    table.string('avatar').nullable().comment('头像');
    table.string('password', 40).nullable().comment('密码');
    table.string('salt', 6).nullable().comment('密码盐');
    table.string('remember_token').nullable().comment('令牌');
    table.uuid('uuid').notNullable().unique().comment('uuid');
    table.string('secret', 80).notNullable().comment('密钥');
    table.json('extension').nullable().comment('扩展');
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态');
    table.specificType('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.comment('用户表');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${config('database.prefix')}users`);
}