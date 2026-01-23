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