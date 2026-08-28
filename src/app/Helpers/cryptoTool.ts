/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-08 17:50:11
 * @FilePath: node-laravel/src/app/Helpers/CryptoTool.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { TokenPayload } from '#types/utils'
import crypto from 'node:crypto'

/** 解密后的 Token 负载（与 src/types/express/index.d.ts 的 TokenPayload 结构一致） */

export class CryptoTool {
  // P3 加固（2026-08-28）：AES-256-CBC → AES-256-GCM（认证加密，消除 padding oracle 风险）
  private static readonly algorithm = 'aes-256-gcm'
  // 惰性缓存：与旧版 static readonly 语义一致（fallback 随机值仅生成一次，
  // 保证同一进程内 encrypt/decrypt 使用相同 key/iv）
  private static _key?: Buffer
  private static _iv?: Buffer
  private static _warnedFallback = false

  private static warnFallback(name: string): void {
    if (!this._warnedFallback) {
      this._warnedFallback = true
      console.warn(
        `[CryptoTool] ${name} 未配置，已回退为进程内随机值（重启后已加密数据将无法解密，生产环境必须配置）`
      )
    }
  }

  private static getKey(): Buffer {
    if (!this._key) {
      const k = process.env.APP_KEY
      if (!k || !k.trim()) {
        this.warnFallback('APP_KEY')
        this._key = crypto.randomBytes(32)
      } else {
        this._key = Buffer.from(k)
      }
    }
    return this._key
  }

  /**
   * 获取 GCM 初始化向量：优先使用 APP_IV（经 SHA-256 派生为 12 字节，兼容任意长度配置），
   * 未配置时回退为进程内随机 12 字节。
   */
  private static getIv(): Buffer {
    if (!this._iv) {
      const v = process.env.APP_IV
      if (!v || !v.trim()) {
        this.warnFallback('APP_IV')
        this._iv = crypto.randomBytes(12)
      } else {
        this._iv = crypto.createHash('sha256').update(v).digest().subarray(0, 12)
      }
    }
    return this._iv
  }

  private static assertKeyLength(key: Buffer): void {
    if (Buffer.byteLength(key) !== 32) {
      throw new Error('Invalid key or iv length')
    }
  }

  /**
   * GCM 加密：输出格式 <iv 12B hex><authTag 16B hex><ciphertext hex>
   */
  private static gcmEncrypt(text: string, key: Buffer, iv: Buffer): string {
    this.assertKeyLength(key)
    const cipher = crypto.createCipheriv(this.algorithm, key, iv)
    const ct = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return iv.toString('hex') + tag.toString('hex') + ct.toString('hex')
  }

  /**
   * GCM 解密：从密文头部解析 IV 与认证标签，认证失败（数据被篡改）时抛出异常
   */
  private static gcmDecrypt(encoded: string, key: Buffer): string {
    this.assertKeyLength(key)
    const buf = Buffer.from(encoded, 'hex')
    if (buf.length < 28) {
      throw new Error('Invalid encrypted payload length')
    }
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const ct = buf.subarray(28)
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
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
  // 加密函数（AES-256-GCM，输出 <iv><tag><ciphertext> 拼接 hex）
  public static encrypt(encryptedData: unknown, keyStr: string | false = false, ivStr: string | false = false): string | undefined {
    if (!encryptedData) return
    const key = keyStr ? Buffer.from(keyStr) : this.getKey()
    const iv = ivStr ? Buffer.from(crypto.createHash('sha256').update(ivStr).digest().subarray(0, 12)) : this.getIv()
    try {
      const encryptedText = typeof encryptedData == 'string' ? encryptedData : JSON.stringify(encryptedData)
      return this.gcmEncrypt(encryptedText, key, iv)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Encryption failed: ${errorMessage}`)
    }
  }
  // 解密函数（IV 与认证标签从密文头部解析；认证失败即抛错，防止密文被篡改）
  public static decrypt(encryptedText: string, keyStr: string | false = false): unknown {
    if (!encryptedText) return
    const key = keyStr ? Buffer.from(keyStr) : this.getKey()
    try {
      const decrypted = this.gcmDecrypt(encryptedText, key)

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
      throw new Error(`Decryption failed: ${errorMessage}${additionalInfo}`)
    }
  }
  // 生成一个简单的 Token (示例：用户ID + 时间戳)
  public static generateToken(payload: string): string {
    try {
      return this.gcmEncrypt(payload, this.getKey(), this.getIv())
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Encryption failed: ${errorMessage}`)
    }
  }
  // 校验 Token
  public static decryptToken(encryptedText: string): TokenPayload | null | undefined {
    try {
      const decrypted = this.gcmDecrypt(encryptedText, this.getKey())
      // 如果返回的是字符串，则解析为对象
      let decryptedPayload = null
      try {
        decryptedPayload = JSON.parse(decrypted)
      } catch (error) {
        console.error('Failed to parse decrypted token:', error)
      }
      return decryptedPayload
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Decryption failed: ${errorMessage}`)
    }
  }
}
