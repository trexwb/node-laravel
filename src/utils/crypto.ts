import crypto from 'node:crypto';
import { config } from '#bootstrap/configLoader';

export class Crypto {
  private static readonly algorithm = 'aes-256-cbc';
  private static readonly key = Buffer.from(config('app.security.app_key') || crypto.randomBytes(32));
  private static readonly iv = Buffer.from(config('app.security.app_iv') || crypto.randomBytes(16));

  // md5加密
  public static md5(str: string): string {
    const md5 = crypto.createHash('md5');
    md5.update(str);
    return md5.digest('hex');
  }
  // 使用更安全的哈希算法 SHA-256 替换 MD5
  public static sha256(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex');
  }
  // HMAC-SHA1 签名函数
  public static sha1(encryptedData: string, keyStr: string | false = false): string {
    return crypto.createHmac('sha1', keyStr || this.key).update(encryptedData).digest('base64');
  }
  // 加密函数
  public static encrypt(encryptedData: any, keyStr: string | false = false, ivStr: string | false = false): string | undefined {
    if (!encryptedData) return;
    const key = keyStr || this.key;
    const iv = ivStr || this.iv;
    try {
      // 验证 key 和 iv 的长度
      if (Buffer.byteLength(key) !== 32 || Buffer.byteLength(iv) !== 16) {
        throw new Error('Invalid key or iv length');
      }
      const encryptedText = JSON.stringify(encryptedData);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      let encrypted = cipher.update(encryptedText, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Encryption failed: ${errorMessage}`);
    }
  }
  // 解密函数
  public static decrypt(encryptedText: string, keyStr: string | false = false, ivStr: string | false = false): any {
    if (!encryptedText) return;
    const key = keyStr || this.key;
    const iv = ivStr || this.iv;
    try {
      // 验证 key 和 iv 的长度
      if (Buffer.byteLength(key) !== 32 || Buffer.byteLength(iv) !== 16) {
        throw new Error('Invalid key or iv length');
      }
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      // 验证解密后的字符串是否为有效的 JSON
      try {
        return JSON.parse(decrypted);
      } catch (jsonError) {
        throw new Error('Invalid JSON format after decryption');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Encryption failed: ${errorMessage}`);
    }
  }
  // 生成一个简单的 Token (示例：用户ID + 时间戳)
  public static generateToken(payload: string): string {
    try {
      const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
      let encrypted = cipher.update(payload, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${this.iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Encryption failed: ${errorMessage}`);
    }
  }
  // 校验 Token
  public static decryptToken(token: string): any {
    try {
      const [ivHex, encryptedText] = token.split(':');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, Buffer.from(ivHex, 'hex'));
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      // 如果返回的是字符串，则解析为对象
      let decryptedPayload = null;
      if (typeof decrypted === 'string') {
        try {
          decryptedPayload = JSON.parse(decrypted);
        } catch (error) {
          console.error('Failed to parse decrypted token:', error);
        }
      } else {
        decryptedPayload = decrypted;
      }
      return decryptedPayload;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Encryption failed: ${errorMessage}`);
    }
  }
}