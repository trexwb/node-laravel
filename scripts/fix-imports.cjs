#!/usr/bin/env node

/**
 * 修复编译产物中的 ESM 相对导入扩展名
 *
 * 背景：tsc-alias 将 #app/* 等别名重写为相对路径时不会补 .js 扩展名，
 * 而 NodeNext ESM 模式下相对导入必须带扩展名，否则运行时 ERR_MODULE_NOT_FOUND。
 *
 * 作用：遍历 dist 下的 .js 文件，为缺失扩展名的相对导入（./x、../x）补全 .js，
 * 以目标文件真实存在为准，避免误改。
 *
 * 用法：node ./scripts/fix-imports.cjs [目录]
 * 默认目录：./dist/src
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(process.argv[2] || './dist/src');

// 匹配 import ... from '...' / export ... from '...' / import('...') / 裸 import '...' 中的相对路径
const RE_IMPORT = /((?:from|import\s*\(|import|export\s+[^;]*?\s+from)\s*['"])(\.\.?\/[^'"]+)(['"])/g;

// 匹配 tsc-alias 丢失 ./ 前缀的裸路径导入（如 'requestContext.js'、'System/CacheInvalidatedListener.js'）
// 仅当同目录存在对应文件/目录时才补 ./，避免误改 npm 包与 Node 内置模块
const RE_BARE = /((?:from|import\s*\(|import|export\s+[^;]*?\s+from)\s*['"])([^'"]+)(['"])/g;

let totalFixed = 0;
let totalFiles = 0;

function hasExt(p) {
  return /\.[a-zA-Z0-9]+$/.test(p);
}

function resolveTarget(baseFile, importPath) {
  const base = path.dirname(baseFile);
  const candidates = [
    importPath + '.js',
    importPath + '/index.js',
    importPath + '.json',
    importPath + '.mjs',
    importPath + '.cjs',
  ];
  for (const c of candidates) {
    const abs = path.resolve(base, c);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      return path.relative(base, abs).split(path.sep).join('/');
    }
  }
  return null;
}

function fixFile(file) {
  const ext = path.extname(file);
  if (ext !== '.js' && ext !== '.mjs' && ext !== '.cjs') return;
  const orig = fs.readFileSync(file, 'utf8');
  let count = 0;
  let fixed = orig.replace(RE_IMPORT, (m, prefix, importPath, suffix) => {
    if (hasExt(importPath)) return m; // 已有扩展名
    // 跳过目录形式（以 / 结尾）
    if (importPath.endsWith('/')) return m;
    const target = resolveTarget(file, importPath);
    if (!target) return m; // 目标不存在，不修改
    count++;
    return `${prefix}${target}${suffix}`;
  });
  fixed = fixed.replace(RE_BARE, (m, prefix, barePath, suffix) => {
    // 跳过相对/绝对/内置模块/别名/URL 形式
    if (barePath.startsWith('./') || barePath.startsWith('../') || barePath.startsWith('/') || barePath.startsWith('node:') || barePath.startsWith('#') || barePath.startsWith('http')) return m;
    // 同目录下存在对应文件或目录（含 index.js）→ 补 ./ 前缀
    const base = path.dirname(file);
    const abs = path.resolve(base, barePath);
    const isFile = fs.existsSync(abs) && fs.statSync(abs).isFile();
    const isDirIndex = [path.join(abs, 'index.js'), path.join(abs, 'index.mjs'), path.join(abs, 'index.cjs')].some(p => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!isFile && !isDirIndex) return m;
    count++;
    return `${prefix}./${barePath}${suffix}`;
  });
  if (count > 0) {
    fs.writeFileSync(file, fixed, 'utf8');
    totalFixed += count;
    totalFiles++;
    console.log(`  🔧 ${path.relative(ROOT_DIR, file)}: 修复 ${count} 处`);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile()) {
      fixFile(full);
    }
  }
}

console.log(`🔍 扫描 ${ROOT_DIR} ...`);
walk(ROOT_DIR);
console.log(`✅ 完成：${totalFiles} 个文件、${totalFixed} 处导入已修复`);
