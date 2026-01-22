import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${process.env.DB_PREFIX}seeds`, (table) => {
    table.increments('id').primary(); // 自增ID
    table.string('name').notNullable().comment('种子文件名或标识符');
    table.integer('batch').unsigned().comment('批次号');
    table.timestamp('migration_time').nullable();
    table.comment('种子数据执行');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${process.env.DB_PREFIX}seeds`);
}