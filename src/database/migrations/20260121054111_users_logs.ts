import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${process.env.DB_PREFIX}users_logs`, (table) => {
    table.increments('id');
    table.integer('user_id').unsigned();
    table.foreign('user_id').references('id').inTable(`${process.env.DB_PREFIX}users`);
    table.json('source').nullable();
    table.text('handle').notNullable();
    table.timestamps().defaultTo(knex.fn.now());
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${process.env.DB_PREFIX}users_logs`);
}