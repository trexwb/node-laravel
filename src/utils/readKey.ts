/*
 * @Author: trexwb
 * @Date: 2026-03-11 00:00:00
 * @LastEditors: trexwb
 * @LastEditTime: 2026-05-14 17:40:00
 * @FilePath: /stl-dev-server/server/src/utils/readKey.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'

export function readKey(options: { key?: string; keyPath?: string; nameForError: string }): string {
  if (options.key && options.key.trim()) return options.key.trim()
  if (options.keyPath && options.keyPath.trim()) {
    const p = options.keyPath.trim()
    // 如果内容看起来已经是 PEM 格式或 base64 密钥（而非文件路径），直接返回
    // 增强判断：不以常见路径分隔符开头 且 长度超过 200（典型的 RSA-2048 base64 约 400 字符）
    if (
      p.includes('-----BEGIN') ||
      (!p.startsWith('/') && !p.startsWith('./') && !p.startsWith('../') && !p.startsWith('~') && p.length > 200)
    ) {
      return p
    }
    const content = fs.readFileSync(p, 'utf8')
    if (content && content.trim()) return content.trim()
  }
  throw new Error(`${options.nameForError} is required`)
}

/**
 * 将原始 base64 公钥规范化为 PEM 格式
 * 支付宝后台提供的公钥是原始 base64 字符串（无 PEM 头尾），
 * 而 Node.js crypto.verify() 要求标准 PEM 格式。
 *
 * 注意：alipay-sdk 内部的 formatKey() 也会做类似处理，
 * 但如果自行使用 crypto.verify() 则需要手动规范化。
 */
export function normalizeToPem(rawKey: string): string {
  const trimmed = rawKey.trim()

  // 已经是 PEM 格式，直接返回
  if (trimmed.includes('-----BEGIN')) {
    return trimmed
  }

  // 去除所有空白，重新按 64 字符换行（标准 PEM 格式）
  const b64 = trimmed.replace(/\s+/g, '')
  const lines = b64.match(/.{1,64}/g) || [b64]

  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`
}

/**
 * 计算 PEM 公钥的 SHA256 指纹，用于诊断密钥是否与支付宝后台配置一致
 */
export function publicKeyFingerprint(pem: string): string {
  const trimmed = pem.trim()
  // 提取 base64 内容（去掉 PEM 头尾）
  let b64 = trimmed
  if (trimmed.includes('-----BEGIN')) {
    const lines = trimmed.split('\n')
    b64 = lines.filter((l) => !l.includes('-----BEGIN') && !l.includes('-----END')).join('')
  }
  b64 = b64.replace(/\s+/g, '')
  return crypto.createHash('sha256').update(b64).digest('hex').substring(0, 16)
}
