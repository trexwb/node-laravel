// src/artisan.ts
import 'dotenv/config';
import { Command } from 'commander';
import { container, bootstrap } from '#bootstrap/app';
import { QueueWorker } from '#app/Console/Commands/QueueWorker';
import { CacheService } from '#app/Services/Cache/CacheService';
import { config } from '#bootstrap/configLoader';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

// 在执行任何命令前，必须先执行引导程序（加载 DB 等）
const init = async () => {
  const { app } = container;
  await bootstrap(app);
};

program
  .name('artisan')
  .description('Node Laravel Framework 命令行工具')
  .version('1.0.0');

// --- 注册命令 1: queue:work ---
program
  .command('queue:work')
  .description('启动队列消费者进程')
  .action(async () => {
    await init();
    await QueueWorker.run();
  });

// --- 注册命令 2: cache:clear ---
program
  .command('cache:clear')
  .description('清除所有缓存')
  .action(async () => {
    await init();
    await CacheService.getDriver().flush();
    console.log('Successfully cleared the cache.');
    process.exit(0);
  });

// --- 注册命令 3: storage:link ---
program
  .command('storage:link')
  .description('创建存储目录符号链接')
  .action(async () => {
    const publicPath = path.resolve(__dirname, './public/uploads');
    const storagePath = path.resolve(__dirname, config('app.upload_path'));

    // === 安全删除已存在的软链接或文件/目录 ===
    try {
      // 注意：这里使用 fs.unlink 删除软链接（不是 rm）
      // 因为 public/uploads 应该是一个软链接（文件类型），不是目录
      await fs.unlink(publicPath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        // 如果不是“不存在”，则可能是普通目录或文件，尝试用 rm 删除
        try {
          await fs.rm(publicPath, { recursive: true, force: true });
        } catch (rmErr) {
          // 如果还是失败，抛出原始错误
          throw err;
        }
      }
      // ENOENT 表示不存在，忽略即可
    }

    try {
      // 确保 storage 目录存在
      await fs.mkdir(storagePath, { recursive: true });
      // 创建软连接
      if (process.platform === 'win32') {
        await fs.symlink(storagePath, publicPath, 'junction');
      } else {
        await fs.symlink(storagePath, publicPath);
      }
      console.log(`The [${publicPath}] link has been connected to [${storagePath}].`);
    } catch (err: any) {
      if (err.code === 'EEXIST') {
        console.warn('The "public/storage" directory already exists.');
      } else {
        console.error('Error creating storage link:', err.message);
      }
    }
    process.exit(0);
  });

program.parse();