import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${process.env.DB_PREFIX}configs`, (table) => {
    table.increments('id').primary(); // 自增ID
    table.string('key').notNullable().comment('关键字');
    table.json('value').nullable().comment('值');
    table.timestamps();
    table.timestamp('deleted_at').nullable();
    table.comment('基础配置');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${process.env.DB_PREFIX}configs`);
}