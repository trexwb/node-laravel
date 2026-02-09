/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:56:59
 * @FilePath: /node-laravel/src/app/Traits/HashPasswordTrait.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import crypto from 'node:crypto';

export const HashPasswordTrait = {
  makeHash(password: string, salt: string): string {
    return crypto.createHash('md5').update(password + salt).digest('hex');
  },

  generateSalt(): string {
    return Math.random().toString(36).substring(2, 6);
  }
};