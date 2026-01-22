import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${process.env.DB_PREFIX}users_roles`, (table) => {
    table.integer('user_id').unsigned().comment('用户编号');
    table.foreign('user_id').references('id').inTable(`${process.env.DB_PREFIX}users`).onDelete('CASCADE').onUpdate('CASCADE');
    table.integer('role_id').unsigned().comment('角色编号');
    table.foreign('role_id').references('id').inTable(`${process.env.DB_PREFIX}roles`).onDelete('CASCADE').onUpdate('CASCADE');
    table.specificType('status', 'TINYINT UNSIGNED').defaultTo(0).comment('状态:0禁用,1启用');
    table.comment('用户角色关系');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${process.env.DB_PREFIX}users_roles`);
}