import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${process.env.DB_PREFIX}roles`, (table) => {
    table.increments('id').primary(); // 自增ID
    table.string('name', 40).notNullable().comment('角色');
    table.json('permissions').nullable().comment('基础权限');
    table.json('extension').nullable().comment('扩展');
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态');
    table.specificType('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.comment('角色');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${process.env.DB_PREFIX}roles`);
}