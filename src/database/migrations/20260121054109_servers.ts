/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:48:43
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-05 17:50:41
 * @FilePath: /ts/gateway/src/database/migrations/20260121054107_servers.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import type { Knex } from "knex";
import { config } from '#bootstrap/configLoader';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${config('database.prefix')}servers`, (table) => {
    table.increments('id').primary();
    table.string('name', 40).notNullable().comment('服务名称');
    table.string('url').notNullable().comment('服务地址');
    table.string('key', 40).notNullable().comment('服务关键词');
    table.string('app_id', 40).notNullable().comment('服务appid');
    table.string('app_secret', 40).notNullable().comment('服务密钥');
    table.string('app_iv', 40).notNullable().comment('密钥向量');
    table.json('extension').nullable().comment('配置扩展');
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态：0禁用，1启用');
    table.specificType('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.comment('微服务');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${config('database.prefix')}servers`);
}