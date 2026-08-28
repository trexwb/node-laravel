#!/usr/bin/env node

/**
 * 打包脚本（node-laravel 部署包）
 * - 生成生产环境 package.json（main 指向 ./src/public/index.js）
 * - 复制 .env.example 为 .env
 * - 将 dist/src 编译产物复制为部署包内的 src/
 * - 仅安装生产依赖，并清理多平台二进制冗余
 * - 输出 server-build.zip，可直接上传任意 Serverless 云服务（FC / SCF / 云函数等）
 *
 * 用法：npm run pack
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SERVER_DIR = process.cwd();
const TEMP_DIR = path.join(SERVER_DIR, '.pack-temp');
const ZIP_NAME = 'server-build.zip';

console.log('📦 开始打包...');

// 1. 读取原 package.json
const pkg = JSON.parse(fs.readFileSync(path.join(SERVER_DIR, 'package.json'), 'utf-8'));

// 2. 创建临时目录
if (fs.existsSync(TEMP_DIR)) {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEMP_DIR, { recursive: true });

// 3. 生成生产环境 package.json
const prodPkg = {
  name: pkg.name,
  version: pkg.version,
  type: pkg.type,
  main: './src/public/index.js',
  dependencies: pkg.dependencies,
  scripts: {
    'start': 'node ./src/public/index.js',  // Serverless 启动（HTTP + 队列 Worker 同进程）
    'knex': 'node ./node_modules/knex/bin/cli.js --knexfile ./src/database/knexfile.js',
    'artisan': 'node ./src/artisan.js',
    'migrate:latest': 'node ./node_modules/knex/bin/cli.js migrate:latest --knexfile ./src/database/knexfile.js',
    'migrate:rollback': 'node ./node_modules/knex/bin/cli.js migrate:rollback --knexfile ./src/database/knexfile.js',
    'migrate:make': 'node ./node_modules/knex/bin/cli.js migrate:make --knexfile ./src/database/knexfile.js -x js',
    'seed:run': 'node ./node_modules/knex/bin/cli.js seed:run --knexfile ./src/database/knexfile.js',
    'start:fc': 'node ./scripts/start-fc.js'
  }
};

fs.writeFileSync(
  path.join(TEMP_DIR, 'package.json'),
  JSON.stringify(prodPkg, null, 2)
);
console.log('✅ 生成生产 package.json');

// 4. 复制 .env.example（模板）与 .env（初始配置）
const envExamplePath = path.join(SERVER_DIR, '.env.example');
if (fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, path.join(TEMP_DIR, '.env.example'));
  console.log('✅ 复制 .env.example → .env.example');
}
const envPath = path.join(TEMP_DIR, '.env');
if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ 复制 .env.example → .env');
}

// 5. 复制 dist/src 到部署包 src/
const distPath = path.join(SERVER_DIR, 'dist');
const srcPath = path.join(TEMP_DIR, 'src');
if (fs.existsSync(distPath)) {
  fs.mkdirSync(srcPath, { recursive: true });
  execSync(`cp -r ${path.join(distPath, 'src', '*')} ${srcPath}/`, { stdio: 'inherit' });
  console.log('✅ 复制 dist/src → src/');

  // 🗑️ 删除 .map 文件（source map，生产环境不需要，可节省约 30% 体积）
  try {
    execSync(`find "${srcPath}" -type f -name "*.map" -delete 2>/dev/null`, { stdio: 'pipe' });
    console.log('  🗑️  删除 dist 中的 .map 文件');
  } catch (err) {}
}

// 6. 安装生产依赖（重新安装，只装生产依赖）
const nmDest = path.join(TEMP_DIR, 'node_modules');
console.log('📦 安装生产依赖（--omit=dev --ignore-scripts）...');
process.chdir(TEMP_DIR);
execSync('npm install --omit=dev --ignore-scripts', { stdio: 'inherit' });
process.chdir(SERVER_DIR);

// 清理 node_modules 中的大文件（仅保留 linux-x64 平台二进制）
console.log('🧹 清理 node_modules 冗余文件...');
if (fs.existsSync(nmDest)) {
  // 🗑️ 删除 sharp 多平台文件（只保留 linux-x64）
  const sharpVendorDir = path.join(nmDest, 'sharp', 'vendor', 'lib');
  if (fs.existsSync(sharpVendorDir)) {
    const platforms = fs.readdirSync(sharpVendorDir);
    platforms.forEach(platform => {
      if (platform !== 'linux-x64') {
        const platformPath = path.join(sharpVendorDir, platform);
        fs.rmSync(platformPath, { recursive: true, force: true });
        console.log(`  🗑️  删除 sharp/vendor/lib/${platform}`);
      }
    });
  }

  // 🗑️ 清理 @img 多平台二进制（只保留 linux-x64）
  const imgDir = path.join(nmDest, '@img');
  if (fs.existsSync(imgDir)) {
    const imgPlatforms = fs.readdirSync(imgDir);
    const keepPlatforms = ['sharp-linux-x64'];  // 只保留 Linux x64
    imgPlatforms.forEach(platform => {
      if (!keepPlatforms.includes(platform)) {
        const platformPath = path.join(imgDir, platform);
        fs.rmSync(platformPath, { recursive: true, force: true });
        console.log(`  🗑️  删除 @img/${platform}`);
      }
    });
  }

  // 🗑️ 清理 @napi-rs 多平台文件（只保留 linux-x64）
  const napiDir = path.join(nmDest, '@napi-rs');
  if (fs.existsSync(napiDir)) {
    const napiPackages = fs.readdirSync(napiDir);
    napiPackages.forEach(pkg => {
      const pkgPath = path.join(napiDir, pkg);
      if (fs.statSync(pkgPath).isDirectory()) {
        const files = fs.readdirSync(pkgPath);
        files.forEach(file => {
          if (!file.includes('linux') && !file.includes('x64')) {
            const filePath = path.join(pkgPath, file);
            if (file.endsWith('.node') || file.includes('darwin') || file.includes('win32')) {
              fs.rmSync(filePath, { recursive: true, force: true });
              console.log(`  🗑️  删除 @napi-rs/${pkg}/${file}`);
            }
          }
        });
      }
    });
  }

  // 🗑️ 清理 @esbuild 多平台文件（只保留 linux-x64）
  const esbuildDir = path.join(nmDest, '@esbuild');
  if (fs.existsSync(esbuildDir)) {
    const esbuildPlatforms = fs.readdirSync(esbuildDir);
    esbuildPlatforms.forEach(platform => {
      if (!platform.includes('linux-x64')) {
        const platformPath = path.join(esbuildDir, platform);
        fs.rmSync(platformPath, { recursive: true, force: true });
        console.log(`  🗑️  删除 @esbuild/${platform}`);
      }
    });
  }

  // 🗑️ 清理 lightningcss 多平台文件（只保留 linux-x64-gnu）
  const lightningcssDir = path.join(nmDest, 'lightningcss-linux-arm64-gnu');
  if (fs.existsSync(lightningcssDir)) {
    fs.rmSync(lightningcssDir, { recursive: true, force: true });
    console.log('  🗑️  删除 lightningcss-linux-arm64-gnu');
  }

  // 🗑️ 删除 pdfjs-dist 的测试和示例文件
  const pdfjsDir = path.join(nmDest, 'pdfjs-dist');
  if (fs.existsSync(pdfjsDir)) {
    const pdfjsTestDir = path.join(pdfjsDir, 'test');
    if (fs.existsSync(pdfjsTestDir)) {
      fs.rmSync(pdfjsTestDir, { recursive: true, force: true });
      console.log('  🗑️  删除 pdfjs-dist/test');
    }
    const pdfjsExamplesDir = path.join(pdfjsDir, 'examples');
    if (fs.existsSync(pdfjsExamplesDir)) {
      fs.rmSync(pdfjsExamplesDir, { recursive: true, force: true });
      console.log('  🗑️  删除 pdfjs-dist/examples');
    }
  }

  // 🗑️ 清理 puppeteer 缓存与本地 Chromium
  const puppeteerCache = path.join(nmDest, 'puppeteer', '.cache');
  if (fs.existsSync(puppeteerCache)) {
    fs.rmSync(puppeteerCache, { recursive: true, force: true });
    console.log('  🗑️  删除 puppeteer/.cache');
  }
  const localChromium = path.join(nmDest, '.local-chromium');
  if (fs.existsSync(localChromium)) {
    fs.rmSync(localChromium, { recursive: true, force: true });
    console.log('  🗑️  删除 .local-chromium');
  }

  // 🗑️ 删除文档文件（.md, LICENSE, CHANGELOG, README）
  try {
    execSync(`find "${nmDest}" -type f \\( -name "*.md" -o -name "LICENSE*" -o -name "CHANGELOG*" -o -name "README*" \\) -delete 2>/dev/null`, { stdio: 'pipe' });
    console.log('  🗑️  删除文档文件（.md, LICENSE, CHANGELOG, README）');
  } catch (err) {}

  // 🗑️ 删除 .d.ts 类型定义
  try {
    execSync(`find "${nmDest}" -type f -name "*.d.ts" -delete 2>/dev/null`, { stdio: 'pipe' });
    console.log('  🗑️  删除 .d.ts 类型定义');
  } catch (err) {}

  // 🗑️ 删除源码文件（.ts, .tsx, .map），只保留编译后的 .js
  try {
    execSync(`find "${nmDest}" -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.map" \\) ! -name "*.d.ts" -delete 2>/dev/null`, { stdio: 'pipe' });
    console.log('  🗑️  删除源码文件和 source map（.ts, .tsx, .map）');
  } catch (err) {}

  const nmStats = execSync(`du -sh "${nmDest}"`).toString().trim().split('\t')[0];
  console.log(`✅ node_modules 清理完成：${nmStats}`);
}

// 7. 复制其他必要文件
const filesToCopy = ['.npmrc', 'Dockerfile'];
filesToCopy.forEach(file => {
  const src = path.join(SERVER_DIR, file);
  const dest = path.join(TEMP_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ 复制 ${file}`);
  }
});

// 复制 scripts 目录下的启动/初始化脚本
const scriptsDir = path.join(SERVER_DIR, 'scripts');
const scriptsDest = path.join(TEMP_DIR, 'scripts');
const scriptsToCopy = ['install.cjs', 'start-fc.js', 'start-fc.sh'];
fs.mkdirSync(scriptsDest, { recursive: true });
scriptsToCopy.forEach(file => {
  const src = path.join(scriptsDir, file);
  const dest = path.join(scriptsDest, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ 复制 scripts/${file}`);
    if (file.endsWith('.sh')) {
      fs.chmodSync(dest, 0o755);
      console.log(`  ✅ 设置 scripts/${file} 可执行权限`);
    }
  }
});

// 8. 创建 zip
const zipPath = path.join(SERVER_DIR, ZIP_NAME);
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

try {
  process.chdir(TEMP_DIR);
  execSync(`zip -r ${zipPath} .`, { stdio: 'inherit' });

  // 9. 统计
  const stats = fs.statSync(zipPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(1);

  console.log('');
  console.log(`✅ 打包完成：${ZIP_NAME}`);
  console.log(`📊 大小：${sizeMB} MB`);
  console.log('');
  console.log('部署时解压后执行:');
  console.log('  node scripts/install.cjs  # 初始化 .env 与运行时目录');
  console.log('  npm start                 # 启动服务（HTTP + Queue Worker）');
  console.log('  或 npm run start:fc       # 阿里云 FC 同进程启动');
} finally {
  // 10. 清理临时目录（无论如何都会执行）
  process.chdir(SERVER_DIR);
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  console.log('🧹 已清理 .pack-temp 目录');
}
