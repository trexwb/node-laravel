/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: ${git_name}
 * @LastEditTime: 2026-04-08 17:50:11
 * @FilePath: /stl-dev-server/server/src/utils/CryptoTool.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { TokenPayload } from '#types/utils'
import crypto from 'node:crypto'

/** 解密后的 Token 负载（与 src/types/express/index.d.ts 的 TokenPayload 结构一致） */

export class CryptoTool {
  private static readonly algorithm = 'aes-256-cbc'
  // 惰性缓存：与旧版 static readonly 语义一致（fallback 随机值仅生成一次，
  // 保证同一进程内 encrypt/decrypt 使用相同 key/iv）
  private static _key?: Buffer
  private static _iv?: Buffer
  private static getKey(): Buffer {
    if (!this._key) {
      const k = process.env.APP_KEY
      this._key = Buffer.from(k && k.trim() ? k : crypto.randomBytes(32))
    }
    return this._key
  }
  private static getIv(): Buffer {
    if (!this._iv) {
      const v = process.env.APP_IV
      this._iv = Buffer.from(v && v.trim() ? v : crypto.randomBytes(16))
    }
    return this._iv
  }
  // md5加密
  public static md5(str: string): string {
    const md5 = crypto.createHash('md5')
    md5.update(str)
    return md5.digest('hex')
  }
  // 使用更安全的哈希算法 SHA-256 替换 MD5
  public static sha256(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex')
  }

  /**
   * HMAC-SHA256 签名（P2 加固：用于 appSecret 签名算法升级，替代弱 md5 拼接）
   */
  public static hmacSha256(str: string, key: string): string {
    return crypto.createHmac('sha256', key).update(str).digest('hex')
  }
  // HMAC-SHA1 签名函数
  public static sha1(encryptedData: string, keyStr: string | false = false): string {
    return crypto
      .createHmac('sha1', keyStr || this.getKey())
      .update(encryptedData)
      .digest('base64')
  }
  // 加密函数
  public static encrypt(encryptedData: unknown, keyStr: string | false = false, ivStr: string | false = false): string | undefined {
    if (!encryptedData) return
    const key = keyStr || this.getKey()
    const iv = ivStr || this.getIv()
    try {
      // 验证 key 和 iv 的长度
      if (Buffer.byteLength(key) !== 32 || Buffer.byteLength(iv) !== 16) {
        throw new Error('Invalid key or iv length')
      }
      const encryptedText = typeof encryptedData == 'string' ? encryptedData : JSON.stringify(encryptedData)
      const cipher = crypto.createCipheriv(this.algorithm, key, iv)
      let encrypted = cipher.update(encryptedText, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      return encrypted
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Encryption failed: ${errorMessage}`)
    }
  }
  // 解密函数
  public static decrypt(
    encryptedText: string,
    keyStr: string | false = false,
    ivStr: string | false = false
  ): TokenPayload | null | undefined {
    if (!encryptedText) return
    const key = keyStr || this.getKey()
    const iv = ivStr || this.getIv()
    try {
      // 验证 key 和 iv 的长度
      if (Buffer.byteLength(key) !== 32 || Buffer.byteLength(iv) !== 16) {
        throw new Error('Invalid key or iv length')
      }
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv)
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      // 开发环境：记录解密后的原始字符串用于调试
      if (process.env.APP_DEBUG === 'true') {
        console.debug(
          {
            encryptedTextLength: encryptedText.length,
            encryptedPreview: encryptedText.substring(0, 50),
            decryptedLength: decrypted.length,
            decryptedPreview: decrypted.substring(0, 100),
          },
          'Decryption details'
        )
      }

      // 验证解密后的字符串是否为有效的 JSON
      try {
        return JSON.parse(decrypted)
      } catch (jsonError) {
        // 增强错误信息，包含解密后的原始内容
        const preview =
          decrypted.length > 0
            ? `Decrypted content: "${decrypted.substring(0, 100)}${decrypted.length > 100 ? '...' : ''}"`
            : 'Decrypted content is empty'
        throw new Error(`Invalid JSON format after decryption. ${preview}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      // 提供更详细的错误信息
      const additionalInfo = errorMessage.includes('Invalid JSON format')
        ? ''
        : ` | Encrypted input: "${encryptedText.substring(0, 50)}${encryptedText.length > 50 ? '...' : ''}"`
      throw new Error(`Encryption failed: ${errorMessage}${additionalInfo}`)
    }
  }
  // 生成一个简单的 Token (示例：用户ID + 时间戳)
  public static generateToken(payload: string): string {
    try {
      const cipher = crypto.createCipheriv(this.algorithm, this.getKey(), this.getIv())
      let encrypted = cipher.update(payload, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      return encrypted
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Encryption failed: ${errorMessage}`)
    }
  }
  // 校验 Token
  public static decryptToken(encryptedText: string): TokenPayload | null | undefined {
    try {
      const decipher = crypto.createDecipheriv(this.algorithm, this.getKey(), this.getIv())
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      // 如果返回的是字符串，则解析为对象
      let decryptedPayload = null
      if (typeof decrypted === 'string') {
        try {
          decryptedPayload = JSON.parse(decrypted)
        } catch (error) {
          console.error('Failed to parse decrypted token:', error)
        }
      } else {
        decryptedPayload = decrypted
      }
      return decryptedPayload
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Encryption failed: ${errorMessage}`)
    }
  }
}
