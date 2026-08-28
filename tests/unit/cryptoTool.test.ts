/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/tests/unit/cryptoTool.test.ts
 * @Description:
 * CryptoTool 单元测试：AES-256-GCM 加解密往返、认证防篡改、密钥派生兼容性。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { CryptoTool } from '#app/Helpers/cryptoTool'

const KEY = 'a'.repeat(32)
const IV = 'b'.repeat(16) // 16 字节旧配置，应经 SHA-256 派生为 12 字节后仍可用

describe('CryptoTool (AES-256-GCM)', () => {
  beforeAll(() => {
    process.env.APP_KEY = KEY
    process.env.APP_IV = IV
  })

  afterAll(() => {
    delete process.env.APP_KEY
    delete process.env.APP_IV
  })

  it('对象加解密往返一致', () => {
    const payload = { id: 1, name: '框架测试', nested: { ok: true } }
    const encrypted = CryptoTool.encrypt(payload)
    expect(encrypted).toBeTruthy()
    const decrypted = CryptoTool.decrypt(encrypted as string)
    expect(decrypted).toEqual(payload)
  })

  it('字符串加解密往返一致（decrypt 按框架语义先 JSON.parse）', () => {
    const encrypted = CryptoTool.encrypt(JSON.stringify('hello world'))
    expect(CryptoTool.decrypt(encrypted as string)).toBe('hello world')
  })

  it('密文被篡改时认证失败（GCM 防篡改）', () => {
    const encrypted = CryptoTool.encrypt({ a: 1 }) as string
    // 翻转密文中间一个字节
    const tampered = encrypted.slice(0, 28) + (encrypted[28] === '0' ? '1' : '0') + encrypted.slice(29)
    expect(() => CryptoTool.decrypt(tampered)).toThrow(/Decryption failed/)
  })

  it('使用显式 key/iv 派生（16 字节 iv 兼容）', () => {
    const encrypted = CryptoTool.encrypt({ a: 1 }, KEY, IV)
    expect(CryptoTool.decrypt(encrypted as string, KEY)).toEqual({ a: 1 })
  })

  it('generateToken / decryptToken 往返', () => {
    const token = CryptoTool.generateToken(JSON.stringify({ token: 'abc', timeStamp: 123 }))
    const payload = CryptoTool.decryptToken(token)
    expect(payload).toEqual({ token: 'abc', timeStamp: 123 })
  })
})
