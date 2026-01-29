/*** 
 * @Author: trexwb
 * @Date: 2026-01-29 11:18:48
 * @LastEditors: trexwb
 * @LastEditTime: 2026-01-29 11:19:19
 * @FilePath: /node-laravel/tests/rm-dsStore.js
 * @Description: 
 * @一花一世界，一叶一如来
 * @Copyright (c) 2026 by 杭州大美, All Rights Reserved. 
 */
import { spawn } from 'child_process';

// 将命令拆分为参数，避免 shell 转义问题
const find = spawn('find', ['../src', '-name', '.DS_Store', '-depth', '-exec', 'rm', '{}', ';']);

find.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

find.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

find.on('close', (code) => {
  if (code === 0) {
    console.log('✅ .DS_Store 文件已清理');
  } else {
    console.error(`⚠️ 清理失败，退出码: ${code}`);
  }
});