import type { Knex } from 'knex';
import fs from 'fs';
import path from 'path';
import Utils from '#utils/index';
import { Crypto } from '#utils/Crypto';
import { fileURLToPath } from 'url';
import { config } from '#bootstrap/configLoader';

export async function seed(knex: Knex): Promise<void> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const rootPath = path.resolve(__dirname, '../../../../');
  const tempFilePath = path.join(rootPath, 'temp_install.json');
  const seedFilePath = path.basename(__filename, path.extname(__filename));
  return await knex(`${config('database.prefix')}seeds`)
    .where({ name: seedFilePath })
    .first()
    .then(async row => {
      if (row) return Promise.resolve(); // 如果已经执行过，则直接返回
      const total = await knex.from(`${config('database.prefix')}users`)
        .count('id', { as: 'total' })
        .first()
        .then((row) => {
          return row.total || 0;
        }).catch(() => {
          return 0;
        });
      if (total === 0) {
        const accountData = {
          'root': {
            salt: Utils.generateRandomString(6),
            password: Utils.generateRandomString(16),
            uuid: Utils.getUUID(),
            secret: Utils.generateRandomString(32)
          },
          'admin': {
            salt: Utils.generateRandomString(6),
            password: Utils.generateRandomString(16),
            uuid: Utils.getUUID(),
            secret: Utils.generateRandomString(32)
          },
          'editor': {
            salt: Utils.generateRandomString(6),
            password: Utils.generateRandomString(16),
            uuid: Utils.getUUID(),
            secret: Utils.generateRandomString(32)
          }
        };
        // Deletes ALL existing entries
        await knex(`${config('database.prefix')}users`).del();
        await knex(`${config('database.prefix')}users`).insert([
          {
            id: 1,
            nickname: 'root',
            email: 'root@damei.com',
            mobile: '13735443052',
            avatar: '',
            password: Crypto.md5(Crypto.md5(accountData.root.password.toString()) + accountData.root.salt.toString()),
            salt: accountData.root.salt,
            remember_token: null,
            uuid: accountData.root.uuid,
            secret: accountData.root.secret,
            extension: JSON.stringify({}),
            status: 1,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
          }, {
            id: 2,
            nickname: 'admin',
            email: 'admin@damei.com',
            mobile: '18088888888',
            avatar: '',
            password: Crypto.md5(Crypto.md5(accountData.admin.password.toString()) + accountData.admin.salt.toString()),
            salt: accountData.admin.salt,
            remember_token: null,
            uuid: accountData.admin.uuid,
            secret: accountData.admin.secret,
            extension: JSON.stringify({}),
            status: 1,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
          }, {
            id: 3,
            nickname: 'editor',
            email: 'editor@damei.com',
            mobile: '18099999999',
            avatar: '',
            password: Crypto.md5(Crypto.md5(accountData.editor.password.toString()) + accountData.editor.salt.toString()),
            salt: accountData.editor.salt,
            remember_token: null,
            uuid: accountData.editor.uuid,
            secret: accountData.editor.secret,
            extension: JSON.stringify({}),
            status: 1,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
          }
        ]).then(async () => {
          await knex(`${config('database.prefix')}users_roles`).insert([{
            user_id: 1,
            role_id: 1,
            status: 1
          }, {
            user_id: 2,
            role_id: 2,
            status: 1
          }, {
            user_id: 3,
            role_id: 3,
            status: 1
          }]);
          // 插入成功后，记录这次执行
          await knex(`${config('database.prefix')}seeds`).insert([{
            name: seedFilePath,
            batch: 1, // 根据实际情况调整批次号
            migration_time: knex.fn.now()
          }]);
          let jsonData = {};
          try {
            jsonData = JSON.parse(fs.readFileSync(tempFilePath, 'utf8'));
          } catch (error) {
            jsonData = {};
          }
          jsonData = {
            ...jsonData,
            accounts: [{
              '账号': 'root',
              '密码': accountData.root.password,
              'UUID': accountData.root.uuid,
              '安全密钥': accountData.root.secret
            }, {
              '账号': 'admin',
              '密码': accountData.admin.password,
              'UUID': accountData.admin.uuid,
              '安全密钥': accountData.admin.secret
            }, {
              '账号': 'editor',
              '密码': accountData.editor.password,
              'UUID': accountData.editor.uuid,
              '安全密钥': accountData.editor.secret
            }]
          };
          fs.writeFileSync(tempFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
        });
      }
    });
};