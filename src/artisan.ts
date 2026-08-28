/*
 * @Author: trexwb
 * @Date: 2026-01-29
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/artisan.ts
 * @Description:
 * 框架命令行工具 — artisan
 * 框架版：已移除业务专属命令（statistics:sync / filter:index / goods:import 等），
 * 业务方可通过 registerXxxCommand(program) 自行扩展。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import 'dotenv/config'
import { bootstrap, container } from '#bootstrap/app'
import { config } from '#bootstrap/configLoader'
import { QueueWorker } from '#app/Console/Commands/QueueWorker'
import { CacheService } from '#app/Services/Cache/CacheService'
import { Command } from 'commander'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const program = new Command()

// 在执行任何命令前，必须先执行引导程序（加载 DB 等）
const init = async () => {
  const { app } = container
  await bootstrap(app)
}

program.name('artisan').description('Node Laravel Framework 命令行工具').version('1.0.0')

// --- 注册命令 1: queue:work ---
program
  .command('queue:work')
  .description('启动队列消费者进程')
  .action(async () => {
    await init()
    await QueueWorker.run()
  })

// --- 注册命令 2: cache:clear ---
program
  .command('cache:clear')
  .description('清除所有缓存')
  .action(async () => {
    await init()
    await CacheService.getDriver().flush()
    console.log('Successfully cleared the cache.')
  })

// --- 注册命令 3: storage:link ---
program
  .command('storage:link')
  .description('创建存储目录符号链接')
  .action(async () => {
    const publicPath = path.resolve(__dirname, './public/uploads')
    const storagePath = path.resolve(__dirname, config<string>('app.upload_path'))
    try {
      await fs.unlink(publicPath)
    } catch (err) {
      const errLike = err as { code?: string }
      if (errLike.code !== 'ENOENT') {
        try {
          await fs.rm(publicPath, { recursive: true, force: true })
        } catch {
          throw err
        }
      }
    }
    try {
      await fs.mkdir(storagePath, { recursive: true })
      if (process.platform === 'win32') {
        await fs.symlink(storagePath, publicPath, 'junction')
      } else {
        await fs.symlink(storagePath, publicPath)
      }
      console.log(`The [${publicPath}] link has been connected to [${storagePath}].`)
    } catch (err) {
      const errLike = err as { code?: string; message?: string }
      if (errLike.code === 'EEXIST') {
        console.warn('The "public/storage" directory already exists.')
      } else {
        console.error('Error creating storage link:', errLike.message)
      }
    }
  })

program.parse()
