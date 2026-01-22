/*** 
 * @Author: trexwb
 * @Date: 2025-07-10 12:12:02
 * @LastEditors: trexwb
 * @LastEditTime: 2026-01-22 11:14:08
 * @FilePath: /print/server/install.js
 * @Description: 
 * @一花一世界，一叶一如来
 * @Copyright (c) 2025 by 杭州大美, All Rights Reserved. 
 */
'use strict';
import 'dotenv/config'; // 简写，自动加载根目录 .env
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. 复制env_template到.env.production
try {
  console.log('💽 正在执行 build...');
  execSync('npm run build', { stdio: 'inherit' });
} catch (err) {
  console.error(`❌ 执行 build 失败`);
  process.exit(1);
}

// 2. 创建uploads目录
try {
  const distPath = path.resolve(__dirname, '../dist');
  fs.mkdirSync(path.resolve(distPath, 'public/uploads'), { recursive: true, mode: 0o777 });
  fs.mkdirSync(path.resolve(distPath, 'storage'), { recursive: true, mode: 0o777 });
  // execSync(`chmod 755 ../dist/storage`, { stdio: 'inherit' });
} catch (err) {
  console.error(`❌ 创建uploads目录: 失败`);
}

// 3. 执行数据库迁移和种子文件
try {
  console.log('💽 正在执行 knex migrate:latest && knex seed:run...');
  execSync('npm run migrate:latest && npm run seed:run', { stdio: 'inherit' });
} catch (err) {
  console.error(`❌ 执行 knex migrate:latest && knex seed:run 失败`);
  process.exit(1);
}

console.log('🎉 服务端初始化流程已完成！');