import type { Knex } from "knex";
import { config } from '#bootstrap/configLoader';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${config('database.prefix')}roles_permissions`, (table) => {
    table.integer('role_id').unsigned().comment('角色编号');
    table.foreign('role_id').references('id').inTable(`${config('database.prefix')}roles`).onDelete('CASCADE').onUpdate('CASCADE');
    table.integer('permission_id').unsigned().comment('权限编号');
    table.foreign('permission_id').references('id').inTable(`${config('database.prefix')}permissions`).onDelete('CASCADE').onUpdate('CASCADE');
    table.comment('角色权限关系');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${config('database.prefix')}roles_permissions`);
}