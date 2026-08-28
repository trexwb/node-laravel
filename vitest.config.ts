/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/vitest.config.ts
 * @Description:
 * Vitest 配置：与 tsconfig paths 对齐（#app/* 等别名），供单元测试解析框架内部 imports。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import path from 'node:path'
import { defineConfig } from 'vitest/config'

const rootDir = import.meta.dirname

const alias = {
  '#app': path.resolve(rootDir, 'src/app'),
  '#bootstrap': path.resolve(rootDir, 'src/bootstrap'),
  '#config': path.resolve(rootDir, 'src/config'),
  '#database': path.resolve(rootDir, 'src/database'),
  '#public': path.resolve(rootDir, 'src/public'),
  '#resources': path.resolve(rootDir, 'src/resources'),
  '#routes': path.resolve(rootDir, 'src/routes'),
  '#storage': path.resolve(rootDir, 'src/storage'),
  '#types': path.resolve(rootDir, 'src/types'),
  '#utils': path.resolve(rootDir, 'src/app/Helpers'),
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: { alias },
})
