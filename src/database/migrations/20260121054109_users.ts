import type { Knex } from "knex";
import { config } from '#bootstrap/configLoader';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${config('database.prefix')}users`, (table) => {
    table.increments('id');
    table.string('nickname', 40).notNullable().comment('昵称');
    table.string('email').notNullable().comment('账号邮箱');
    table.string('mobile').notNullable().comment('账号手机等');
    table.string('avatar').nullable().comment('头像');
    table.string('password', 40).notNullable().comment('密码');
    table.string('salt', 6).notNullable().comment('加密码');
    table.string('remember_token').nullable().comment('令牌');
    table.uuid('uuid').notNullable().unique().comment('uuid');
    table.string('secret', 80).notNullable().comment('密钥');
    table.json('extension').nullable().comment('扩展');
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态');
    table.specificType('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${config('database.prefix')}users`);
}