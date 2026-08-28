/***
 * @Author: trexwb
 * @Date: 2026-08-28 16:50:00
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28 16:50:00
 * @FilePath: /node-laravel/scripts/install.cjs
 * @Description: 部署初始化脚本（安装依赖后 / 部署包解压后执行）
 * @一花一世界，一叶一如来
 * @Copyright (c) 2026 by 杭州大美, All Rights Reserved.
 */
'use strict'
require('dotenv/config') // 自动加载根目录 .env
const fs = require('fs')
const path = require('path')

// server 根目录
const SERVER_ROOT = path.resolve(__dirname, '..')

// 1. 复制 .env.example 到 .env（已存在则跳过，避免覆盖生产配置）
try {
  const sourcePath = path.resolve(SERVER_ROOT, '.env.example')
  const targetPath = path.resolve(SERVER_ROOT, '.env')
  if (!fs.existsSync(sourcePath)) {
    throw Object.assign(new Error(`源文件不存在，请检查路径：${sourcePath}`), { code: 'ENOENT' })
  }
  if (!fs.existsSync(targetPath)) {
    fs.copyFileSync(sourcePath, targetPath)
    console.log(`✅ 已复制 ${sourcePath} → ${targetPath}`)
  } else {
    console.log('⏭️  .env 已存在，跳过复制')
  }
} catch (err) {
  console.error(`❌ 复制文件失败：${err.message}`)
  process.exit(1)
}

// 2. 创建运行时目录（部署包结构为 src/，与 pack.cjs 输出的产物结构一致）
try {
  const srcPath = path.resolve(SERVER_ROOT, './src')
  fs.mkdirSync(path.resolve(srcPath, './public/uploads'), { recursive: true, mode: 0o777 })
  fs.mkdirSync(path.resolve(srcPath, './storage/cache'), { recursive: true, mode: 0o777 })
  fs.mkdirSync(path.resolve(srcPath, './storage/uploads'), { recursive: true, mode: 0o777 })
} catch (err) {
  console.error(`❌ 创建运行时目录失败：${err.message}`)
  process.exit(1)
}

console.log('🎉 初始化流程已完成！')
