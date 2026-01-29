import type { Knex } from "knex";
import { config } from '#bootstrap/configLoader';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${config('database.prefix')}schedules_logs`, (table) => {
    table.increments('id').primary(); // 自增ID
    table.integer('schedule_id').unsigned().comment('密钥编号');
    table.foreign('schedule_id').references('id').inTable(`${config('database.prefix')}schedules`).onDelete('CASCADE').onUpdate('CASCADE');
    table.json('source').nullable().comment('源数据');
    table.json('handle').nullable().comment('操作内容');
    table.specificType('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.comment('密钥变更记');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${config('database.prefix')}schedules_logs`);
}

