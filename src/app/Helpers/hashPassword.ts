/*
 * @Author: trexwb
 * @Date: 2026-01-29
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-05
 * @FilePath: node-laravel/src/app/Helpers/hashPassword.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import crypto from 'node:crypto'

// ============================================================
// 密码哈希工具（P0 安全修复）
// 新哈希：scrypt（抗 GPU 爆破、内存安全），格式 scrypt$N$r$p$salt$hash（自包含）
// 旧哈希：md5 + 短盐（历史遗留），通过 verifyPassword 回退兼容，命中后由调用方静默升级
// ============================================================

const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LEN = 64
const PREFIX = 'scrypt$'

// 删除遗留 MD5 哈希导出（零引用死代码，防误用）
// 密码存储统一走下方 scrypt 实现

/**
 * 生成强密码哈希（scrypt）。
 * 返回 { password, salt }：
 * - password 自包含 scrypt 参数与真实盐，写入 password 列
 * - salt 为 6 位占位串，写入 salt 列以兼容 VARCHAR(6) 列宽约束（真实盐内嵌于 password）
 */
export function makePassword(plain: string): { password: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto.scryptSync(plain, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P })
  return {
    password: `${PREFIX}${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derived.toString('base64')}`,
    salt: crypto.randomBytes(3).toString('hex'),
  }
}

/**
 * 校验密码。
 * - 新格式（scrypt$...）：按内嵌参数与盐进行 scrypt 校验（timingSafeEqual）
 * - 旧格式（md5）：回退兼容，校验通过时 upgrade=true，调用方可静默升级为 scrypt
 */
export function verifyPassword(plain: string, storedPassword: string, legacySalt?: string): { valid: boolean; upgrade: boolean } {
  if (!storedPassword) return { valid: false, upgrade: false }

  if (storedPassword.startsWith(PREFIX)) {
    try {
      const parts = storedPassword.slice(PREFIX.length).split('$')
      if (parts.length !== 5) return { valid: false, upgrade: false }
      const [nStr, rStr, pStr, salt, hashB64] = parts
      const n = Number(nStr)
      const r = Number(rStr)
      const p = Number(pStr)
      if (!n || !r || !p || !salt || !hashB64) return { valid: false, upgrade: false }
      const derived = crypto.scryptSync(plain, salt, KEY_LEN, { N: n, r, p })
      const expected = Buffer.from(hashB64, 'base64')
      const valid = derived.length === expected.length && crypto.timingSafeEqual(derived, expected)
      console.log('valid', valid)
      return { valid, upgrade: false }
    } catch {
      return { valid: false, upgrade: false }
    }
  }

  const legacy = crypto
    .createHash('md5')
    .update(plain + (legacySalt || ''))
    .digest('hex')
  const valid = legacy === storedPassword
  return { valid, upgrade: valid }
}
