/*** 
 * @Author: trexwb
 * @Date: 2026-01-23 15:33:31
 * @LastEditors: trexwb
 * @LastEditTime: 2026-01-28 16:09:12
 * @FilePath: /node-laravel/tests/generate-markdown-tables.js
 * @Description: 
 * @一花一世界，一叶一如来
 * @Copyright (c) 2026 by 杭州大美, All Rights Reserved. 
 */
#!/usr/bin / env node

import fs from 'fs';
import path from 'path';

const ROOT_PATH = '../src/';
const APP_DIR = path.resolve(process.cwd(), ROOT_PATH, './app');

/**
 * 递归扫描
 */
function walk(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;

    const fullPath = path.join(dir, entry.name);
    callback(fullPath, entry);

    if (entry.isDirectory()) {
      walk(fullPath, callback);
    }
  }
}

/**
 * 三位编号
 */
const code = (n) => String(n).padStart(3, '0');

const dirSet = new Set();
const fileMap = new Map(); // key: dir, value: files[]

walk(APP_DIR, (fullPath, entry) => {
  const relative = path
    .relative(process.cwd(), fullPath)
    .replace(/\\/g, '/');

  if (entry.isDirectory()) {
    dirSet.add(relative);
  }

  if (entry.isFile()) {
    const dir = path.dirname(relative).replace(/\\/g, '/');
    if (!fileMap.has(dir)) {
      fileMap.set(dir, []);
    }
    fileMap.get(dir).push(relative);
  }
});

// 排序
const dirs = Array.from(dirSet).sort();

for (const files of fileMap.values()) {
  files.sort();
}

/**
 * 目录 Markdown
 */
function generateDirTable(dirs) {
  let md = '| 码 | 目录 |\n|----|------|\n';
  dirs.forEach((dir, i) => {
    md += `| ${code(i + 1)} | ${dir.replace(ROOT_PATH, '')} |\n`;
  });
  return md;
}

/**
 * 文件 Markdown（按目录编号）
 */
function generateFileTable(fileMap) {
  let md = '| 码 | 文件 |\n|----|------|\n';

  const sortedDirs = Array.from(fileMap.keys()).sort();

  for (const dir of sortedDirs) {
    const files = fileMap.get(dir);
    files.forEach((file, index) => {
      md += `| ${code(index + 1)} | ${file.replace(ROOT_PATH, '')} |\n`;
    });
  }

  return md;
}

// 输出
console.log('```');
console.log(generateDirTable(dirs));
console.log('```');

console.log('```');
console.log(generateFileTable(fileMap));
console.log('```');
