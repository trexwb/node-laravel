/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:50:42
 * @FilePath: /node-laravel/src/app/Helpers/Str.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import { randomBytes } from 'node:crypto';

export class Str {
  private static readonly ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  /**
   * 生成指定长度的随机字符串（不依赖第三方库）
   */
  public static random(length: number = 16): string {
    const bytes = randomBytes(length);
    const chars = Str.ALPHABET;
    const charsLen = chars.length;
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % charsLen];
    }
    return result;
  }

  /**
   * 文本截断
   */
  public static limit(
    value: string,
    limit: number = 100,
    end: string = '...'
  ): string {
    if (value.length <= limit) return value;
    return value.slice(0, limit) + end;
  }
}
