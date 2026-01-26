import type { Knex } from "knex";
import { config } from '#bootstrap/configLoader';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${config('database.prefix')}schedules_logs`, (table) => {
    table.increments('id').primary(); // 自增ID
    table.integer('schedule_id').unsigned().comment('任务编号');
    table.foreign('schedule_id').references('id').inTable(`${config('database.prefix')}schedules`).onDelete('CASCADE').onUpdate('CASCADE');
    table.string('name').notNullable().comment('任务名称');
    table.string('time').notNullable().comment('执行时间');
    table.json('handler').nullable().comment('执行内容');
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态:0非默认，1默认');
    table.specificType('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.comment('计划任务日志');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${config('database.prefix')}schedules_logs`);
}

