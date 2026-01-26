import type { Knex } from "knex";
import { config } from '#bootstrap/configLoader';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${config('database.prefix')}permissions`, (table) => {
    table.increments('id').primary(); // 自增ID
    table.string('key', 60).notNullable().comment('名称');
    table.string('operation').notNullable().comment('操作');
    table.json('extension').nullable().comment('扩展');
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态');
    table.specificType('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.comment('权限');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${config('database.prefix')}permissions`);
}