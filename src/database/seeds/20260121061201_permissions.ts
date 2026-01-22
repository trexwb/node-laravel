import { Knex } from "knex";
import path from 'path';

interface PermissionObject {
  id: null;
  key: string;
  operation: string;
  extension: null;
  status: number;
  created_at: any; // knex.fn.now() 的返回类型
  updated_at: any; // knex.fn.now() 的返回类型
  deleted_at: null;
}

export async function seed(knex: Knex): Promise<void> {
  const seedFilePath = path.basename(__filename, path.extname(__filename));
  return await knex(`${process.env.DB_PREFIX}seeds`)
    .where({ name: seedFilePath })
    .first()
    .then(async row => {
      if (row) return Promise.resolve(); // 如果已经执行过，则直接返回
      const total = await knex.from(`${process.env.DB_PREFIX}permissions`)
        .count('id', { as: 'total' })
        .first()
        .then((row) => {
          return row.total || 0
        }).catch(() => {
          return 0;
        });
      if (total === 0) {
        const permissions = ["systemsSecrets", "systemsConfigs", "systemsCaches", "systemsDatabases", "systemsClients"];
        const permissionObjects: PermissionObject[] = [];
        permissions.forEach(permission => {
          if (permission.includes('Trash')) {
            // 为每个权限生成读、恢复、删除的操作对象
            ['read', 'restore', 'delete'].forEach(action => {
              permissionObjects.push({
                id: null,
                key: permission,
                operation: action,
                extension: null,
                status: 1,
                created_at: knex.fn.now(),
                updated_at: knex.fn.now(),
                deleted_at: null
              })
            });
          } else if (['systemsCaches'].includes(permission)) {
            // 为每个权限生成读、删除的操作对象
            ['read', 'delete'].forEach(action => {
              permissionObjects.push({
                id: null,
                key: permission,
                operation: action,
                extension: null,
                status: 1,
                created_at: knex.fn.now(),
                updated_at: knex.fn.now(),
                deleted_at: null
              })
            });
          } else {
            // 为每个权限生成读、写、删除的操作对象
            ['read', 'write', 'delete'].forEach(action => {
              permissionObjects.push({
                id: null,
                key: permission,
                operation: action,
                extension: null,
                status: 1,
                created_at: knex.fn.now(),
                updated_at: knex.fn.now(),
                deleted_at: null
              })
            });
          }
        });
        // Deletes ALL existing entries
        // await knex(`${process.env.DB_PREFIX}secrets`).del()
        await knex(`${process.env.DB_PREFIX}permissions`).insert(permissionObjects).then(async () => {
          // 插入成功后，记录这次执行
          return await knex(`${process.env.DB_PREFIX}seeds`).insert([{
            name: seedFilePath,
            batch: 1, // 根据实际情况调整批次号
            migration_time: knex.fn.now()
          }]);
        });
      }
    });
};