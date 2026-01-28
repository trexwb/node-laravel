import path from 'path';
import type { Knex } from 'knex';
import { fileURLToPath } from 'url';
import { config } from '#bootstrap/configLoader';

export async function seed(knex: Knex): Promise<void> {
  const __filename = fileURLToPath(import.meta.url);
  const seedFilePath = path.basename(__filename, path.extname(__filename));
  return await knex(`${config('database.prefix')}seeds`)
    .where({ name: seedFilePath })
    .first()
    .then(async row => {
      if (row) return Promise.resolve(); // 如果已经执行过，则直接返回
      const total = await knex.from(`${config('database.prefix')}roles`)
        .count('id', { as: 'total' })
        .first()
        .then((row) => {
          return row.total || 0
        }).catch(() => {
          return 0;
        });
      if (total === 0) {
        const rootPermissions: any[] = [
          "systemsSecrets", "systemsConfigs", "systemsCaches", "systemsDatabases", "systemsClients", "systemsTrash",
          "accountsUsers", "accountsRoles", "accountsPermissions",
        ];
        const adminPermissions: any[] = [
          "accountsUsers", "accountsRoles", "accountsPermissions",
        ];
        const editorPermissions: any[] = [];
        await knex(`${config('database.prefix')}roles`).insert([
          {
            id: 1,
            name: '系统运维',
            permissions: JSON.stringify(rootPermissions) || '[]',
            extension: null,
            status: 1,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
          }, {
            id: 2,
            name: '管理员',
            permissions: JSON.stringify(adminPermissions) || '[]',
            extension: null,
            status: 1,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
          }, {
            id: 3,
            name: '编辑人员',
            permissions: JSON.stringify(editorPermissions) || '[]',
            extension: null,
            status: 1,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
          }
        ]);
        await knex(`${config('database.prefix')}roles_permissions`).del();
        // 修复：确保返回类型一致，并处理异步操作
        const rows = await knex.from(`${config('database.prefix')}roles`)
          .then((rows) => {
            return Array.isArray(rows) ? rows : [];
          })
          .catch(() => {
            return [];
          });

        // 使用 Promise.all 处理并发的异步操作
        await Promise.all(rows.map(async (row) => {
          const result = await knex(`${config('database.prefix')}permissions`).select('id').whereIn('key', row.permissions || []);
          const data = result.map(item => ({
            role_id: row.id,
            permission_id: item.id,
          }));
          if (data.length > 0) {
            await knex(`${config('database.prefix')}roles_permissions`).insert(data);
          }
        }));
        return await knex(`${config('database.prefix')}seeds`).insert([{
          name: seedFilePath,
          batch: 1, // 根据实际情况调整批次号
          migration_time: knex.fn.now()
        }]);
      }
    });
};