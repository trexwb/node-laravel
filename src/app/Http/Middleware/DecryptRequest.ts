/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: ${git_name}
 * @LastEditTime: 2026-04-01 21:44:51
 * @FilePath: /stl-dev-server/server/src/app/Http/Middleware/DecryptRequest.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { config } from '#bootstrap/configLoader'
import { CryptoTool } from '#utils/cryptoTool'
import { createLogger } from '#utils/logger'
import type { NextFunction, Request, Response } from 'express'

const log = createLogger('Middleware:Decrypt')

export const decryptRequest = (req: Request, res: Response, next: NextFunction) => {
  // 1. 检查环境变量
  const isEnabled = config('app.security.request_encrypt')
  if (!isEnabled || req.method === 'GET') return next()

  // 2. 获取加密数据 (通常前端会将加密后的字符串放在 body 的某个字段，或直接作为整个 body)
  if (!req.body) {
    // body 为空（如 Content-Type 不正确或 body-parser 未解析），跳过解密
    return next()
  }
  const encryptedData = req.body.encryptedData
  if (!encryptedData || typeof encryptedData !== 'string') {
    // 记录调试信息：为什么跳过了解密
    if (config('app.debugger')) {
      log.debug(
        {
          path: req.path,
          hasEncryptedData: !!encryptedData,
          encryptedDataType: typeof encryptedData,
          bodyKeys: Object.keys(req.body),
        },
        'Skip decryption - no encryptedData found'
      )
    }
    return next() // 如果不是字符串或没有数据，跳过
  }

  try {
    const appKey = req.secretRow?.appSecret || config('app.security.app_key')
    const appIv = req.secretRow?.appIv || config('app.security.app_iv')

    // 记录调试信息
    if (config('app.debugger')) {
      log.debug(
        {
          path: req.path,
          encryptedLength: encryptedData.length,
          encryptedPreview: encryptedData.substring(0, 50),
          hasCustomKey: !!req.secretRow?.appSecret,
          hasCustomIv: !!req.secretRow?.appIv,
        },
        'Attempting decryption'
      )
    }

    // 3. 执行解密
    const decryptData = CryptoTool.decrypt(encryptedData, appKey, appIv)
    if (!decryptData) {
      log.warn(
        {
          path: req.path,
          encryptedPreview: encryptedData.substring(0, 50),
        },
        'Decryption returned empty result'
      )
      return res.error(400019004001, 'Data decryption failed. Invalid format or key.')
    }

    // 记录成功的解密
    if (config('app.debugger')) {
      log.debug(
        {
          path: req.path,
          decryptedType: typeof decryptData,
          decryptedKeys: typeof decryptData === 'object' ? Object.keys(decryptData) : 'not an object',
        },
        'Decryption successful'
      )
    }

    req.body = decryptData
    next()
  } catch (error) {
    // 增强错误处理：提供更有意义的客户端响应
    const err = error as Error

    // 记录详细的错误信息
    log.error(
      {
        path: req.path,
        method: req.method,
        errorMessage: err.message,
        encryptedDataLength: encryptedData?.length || 0,
        encryptedPreview: encryptedData?.substring(0, 50) || 'N/A',
        stack: config('app.debugger') ? err.stack : undefined,
      },
      'Decryption failed'
    )

    // 根据错误类型返回不同的客户端错误
    if (err.message.includes('Invalid JSON format after decryption')) {
      // 解密成功但JSON解析失败 - 可能是前端传了非JSON数据或格式错误
      return res.error(400019004002, '请求数据格式错误：解密后的内容不是有效的JSON格式')
    } else if (err.message.includes('Invalid key or iv length')) {
      // 密钥长度错误 - 配置问题
      return res.error(500019004003, '服务器配置错误：加密密钥长度不正确')
    } else if (err.message.includes('Encryption failed')) {
      // 其他加密相关的错误
      return res.error(400019004004, '请求数据解密失败，请检查数据格式和密钥')
    }

    // 其他未知错误
    next(error)
  }
}
