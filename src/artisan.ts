// src/artisan.ts
import 'dotenv/config';
import { Command } from 'commander';
import { bootstrap } from '#bootstrap/app';
import { QueueWorker } from '#app/Console/Commands/QueueWorker';
import { CacheService } from '#app/Services/Cache/CacheService';
import { config } from '#bootstrap/configLoader';
import { logger } from '#utils/Logger';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

// 在执行任何命令前，必须先执行引导程序（加载 DB 等）
const init = async () => {
  await bootstrap();
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
    const worker = new QueueWorker();
    await worker.run();
  });

// --- 注册命令 2: cache:clear ---
program
  .command('cache:clear')
  .description('清除所有缓存')
  .action(async () => {
    await init();
    await CacheService.getDriver().flush();
    logger.info('Successfully cleared the cache.');
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
      await fs.unlink(publicPath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        try {
          await fs.rm(publicPath, { recursive: true, force: true });
        } catch (rmErr) {
          throw err;
        }
      }
    }

    try {
      await fs.mkdir(storagePath, { recursive: true });
      if (process.platform === 'win32') {
        await fs.symlink(storagePath, publicPath, 'junction');
      } else {
        await fs.symlink(storagePath, publicPath);
      }
      logger.info(`The [${publicPath}] link has been connected to [${storagePath}].`);
    } catch (err: any) {
      if (err.code === 'EEXIST') {
        logger.warn('The "public/storage" directory already exists.');
      } else {
        logger.error('Error creating storage link:', err.message);
      }
    }
    process.exit(0);
  });

program.parse();
