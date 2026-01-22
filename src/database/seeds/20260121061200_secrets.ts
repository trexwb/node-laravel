import { Knex } from "knex";
import fs from 'fs';
import path from 'path';
import utils from '../../utils/index';

const rootPath = path.resolve(__dirname, '../../../../');
const tempFilePath = path.join(rootPath, 'temp_install.json');

export async function seed(knex: Knex): Promise<void> {
  const seedFilePath = path.basename(__filename, path.extname(__filename));
  return await knex(`${process.env.DB_PREFIX}seeds`)
    .where({ name: seedFilePath })
    .first()
    .then(async row => {
      if (row) return Promise.resolve(); // 如果已经执行过，则直接返回
      const total = await knex.from(`${process.env.DB_PREFIX}secrets`)
        .count('id', { as: 'total' })
        .first()
        .then((row) => {
          return row.total || 0;
        }).catch(() => {
          return 0;
        });
      if (total === 0) {
        const secretsData = {
          title: '网关',
          app_id: utils.unique(16).toString(),
          app_secret: utils.generateRandomString(32),
          app_iv: utils.generateRandomString(16),
          permissions: JSON.stringify(['admin']),
          extension: JSON.stringify({}),
          status: 1,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        };
        // Deletes ALL existing entries
        await knex(`${process.env.DB_PREFIX}secrets`).del();
        await knex(`${process.env.DB_PREFIX}secrets`).insert([secretsData]).then(async () => {
          const secretsJson = {
            'appId': secretsData.app_id,
            'appSecret': secretsData.app_secret,
            'appIv': secretsData.app_iv
          };
          // console.log('请记住相关密钥:');
          // console.table([secretsJson]);
          let jsonData = {};
          try {
            jsonData = JSON.parse(fs.readFileSync(tempFilePath, 'utf8'));
          } catch (error) {
            jsonData = {};
          }
          jsonData = {
            ...jsonData,
            secrets: secretsJson
          };
          fs.writeFileSync(tempFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
          // 插入成功后，记录这次执行
          await knex(`${process.env.DB_PREFIX}seeds`).insert([{
            name: seedFilePath,
            batch: 1, // 根据实际情况调整批次号
            migration_time: knex.fn.now()
          }]);
        });
      }
    });
};