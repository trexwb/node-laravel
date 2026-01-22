import { Knex } from "knex";
import fs from 'fs';
import path from 'path';
import utils from '../../utils/index';
import { Crypto } from '../../utils/crypto';

const rootPath = path.resolve(__dirname, '../../../../');
const tempFilePath = path.join(rootPath, 'temp_install.json');

export async function seed(knex: Knex): Promise<void> {
  const seedFilePath = path.basename(__filename, path.extname(__filename));
  return await knex(`${process.env.DB_PREFIX}seeds`)
    .where({ name: seedFilePath })
    .first()
    .then(async row => {
      if (row) return Promise.resolve(); // 如果已经执行过，则直接返回
      const total = await knex.from(`${process.env.DB_PREFIX}users`)
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
            salt: utils.generateRandomString(6),
            password: utils.generateRandomString(16),
            uuid: utils.getUUID(),
            secret: utils.generateRandomString(32)
          },
          'admin': {
            salt: utils.generateRandomString(6),
            password: utils.generateRandomString(16),
            uuid: utils.getUUID(),
            secret: utils.generateRandomString(32)
          },
          'editor': {
            salt: utils.generateRandomString(6),
            password: utils.generateRandomString(16),
            uuid: utils.getUUID(),
            secret: utils.generateRandomString(32)
          }
        };
        // Deletes ALL existing entries
        await knex(`${process.env.DB_PREFIX}users`).del();
        await knex(`${process.env.DB_PREFIX}users`).insert([
          {
            id: 1,
            nickname: 'root',
            email: 'root@caa.edu.cn',
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
            email: 'admin@caa.edu.cn',
            mobile: '15268550825',
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
            email: 'editor@caa.edu.cn',
            mobile: '15268550825',
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
          await knex(`${process.env.DB_PREFIX}users_roles`).insert([{
            user_id: 1,
            role_id: 1
          }, {
            user_id: 2,
            role_id: 2
          }, {
            user_id: 3,
            role_id: 3
          }]);
          // 插入成功后，记录这次执行
          await knex(`${process.env.DB_PREFIX}seeds`).insert([{
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