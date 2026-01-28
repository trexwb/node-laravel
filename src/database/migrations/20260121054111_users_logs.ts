import type { Knex } from "knex";
import { config } from '#bootstrap/configLoader';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${config('database.prefix')}users_logs`, (table) => {
    table.increments('id');
    table.integer('user_id').unsigned();
    table.foreign('user_id').references('id').inTable(`${config('database.prefix')}users`);
    table.json('source').nullable().comment('源数据');
    table.text('handle').notNullable().comment('操作处理');
    table.specificType('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.comment('用户更新日志');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${config('database.prefix')}users_logs`);
}