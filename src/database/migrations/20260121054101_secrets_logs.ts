import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${process.env.DB_PREFIX}secrets_logs`, (table) => {
    table.increments('id').primary(); // 自增ID
    table.integer('secret_id').unsigned().comment('密钥编号');
    table.foreign('secret_id').references('id').inTable(`${process.env.DB_PREFIX}secrets`).onDelete('CASCADE').onUpdate('CASCADE');
    table.json('source').nullable().comment('操作前');
    table.json('handle').nullable().comment('操作内容');
    table.timestamps();
    table.comment('密钥变更记');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${process.env.DB_PREFIX}secrets_logs`);
}

