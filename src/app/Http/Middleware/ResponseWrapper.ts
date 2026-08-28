/*
 * @Author: trexwb
 * @Date: 2026-01-29
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-01
 * @FilePath: node-laravel/src/app/Http/Middleware/ResponseWrapper.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { formatDateFromUTC } from '#app/Helpers/format'
import type { NextFunction, Request, Response } from 'express'
import type { ApiResponse } from '#types/http'

// 扩展声明见 src/types/express.d.ts（Response.success / Response.error）
// 定义响应数据结构

function normalizeResponseDates(value: unknown): unknown {
  if (value === null || value === undefined) return value

  if (value instanceof Date) {
    return formatDateFromUTC(value)
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeResponseDates(item))
  }

  if (typeof value === 'string') {
    const raw = value.trim()
    // 修复：不能仅凭以 Z 结尾就判断为日期（如产品编码 E25-510SKZ）
    // 必须是完整的 ISO 8601 格式：YYYY-MM-DDTHH:mm:ss.sssZ
    if (
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(raw) ||
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(raw) ||
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+\-]\d{2}:?\d{2}$/.test(raw)
    ) {
      return formatDateFromUTC(raw)
    }
    return value
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      result[key] = normalizeResponseDates(item)
    }
    return result
  }

  return value
}

export const responseWrapper = (_req: Request, res: Response, next: NextFunction) => {
  // 成功响应的快捷方法
  // 重载支持：res.success(data) | res.success(data, msg) | res.success(data, code, msg)
  res.success = function (data: unknown = null, codeOrMsg?: string | number, msg?: string) {
    // 判断第二个参数是 msg 还是 code
    let code: string | number = 200
    let message: string = 'success'
    if (typeof codeOrMsg === 'string') {
      message = codeOrMsg // 第二个参数是字符串 → 当 msg 用
    } else if (typeof codeOrMsg === 'number') {
      code = codeOrMsg // 第二个参数是数字 → 当 code 用
      message = msg || 'success'
    }
    const dataObj: ApiResponse = { code, msg: message }
    if (data) dataObj.data = normalizeResponseDates(data)
    // 提取状态码前3位作为 HTTP 状态码
    const statusCode = Number((code || 400).toString().substring(0, 3)) || 200
    return res.status(statusCode).json(dataObj)
  }
  // 失败响应的快捷方法
  res.error = function (code: string | number = 400, msg: unknown = 'fail') {
    const dataObj: ApiResponse = {
      code,
      msg,
    }
    return res.status(Number((code || 400).toString().substring(0, 3) || 400)).json(dataObj)
  }
  next()
}
