/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:53:39
 * @FilePath: /node-laravel/src/app/Services/Image/ImageService.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import sharp from 'sharp';
import path from 'node:path';
import { config } from '#bootstrap/configLoader';

export class ImageService {
  /**
   * 处理上传并生成缩略图
   */
  public static async processAvatar(buffer: Buffer, filename: string) {
    const storagePath = config('app.upload_path') || './public/uploads';
    const outputPath = path.join(storagePath, `thumb_${filename}.webp`);
    await sharp(buffer)
      .resize(200, 200)
      .webp({ quality: 80 })
      .toFile(outputPath);
    return `/uploads/thumb_${filename}.webp`;
  }
}