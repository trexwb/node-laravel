import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${process.env.DB_PREFIX}users_logs`, (table) => {
    table.increments('id');
    table.integer('user_id').unsigned();
    table.foreign('user_id').references('id').inTable(`${process.env.DB_PREFIX}users`);
    table.json('source').nullable().comment('源数据');
    table.text('handle').notNullable().comment('操作处理');
    table.specificType('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${process.env.DB_PREFIX}users_logs`);
}