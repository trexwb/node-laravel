import type { Knex } from "knex";
import { config } from '#bootstrap/configLoader';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${config('database.prefix')}secrets`, (table) => {
    table.increments('id').primary(); // 自增ID
    table.string('title').notNullable().comment('密钥主体');
    table.string('app_id', 40).notNullable().comment('appid');
    table.string('app_secret', 40).notNullable().comment('密钥');
    table.string('app_iv', 40).notNullable().comment('密钥向量');
    table.json('permissions').nullable().comment('服务权限');
    table.timestamp('times_expire').nullable().comment('有效期');
    table.json('extension').nullable().comment('扩展信息');
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态：0禁用，1启用');
    table.specificType('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.comment('API访问密钥');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${config('database.prefix')}secrets`);
}

