/*
 * @Author: trexwb
 * @Date: 2026-08-17
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-17
 * @FilePath: node-laravel/src/app/Helpers/amount.ts
 * @Description: 金额字符串校验工具 — 基于原始字符串正则，避免浮点乘法误差导致的精度误判
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

/**
 * 校验金额输入是否为合法格式：正整数或最多两位小数。
 *
 * 直接基于字符串做正则匹配，避免 `Math.round(n * 100) !== n * 100` 的浮点误差
 * 误拒 0.29 / 0.57 / 1.13 / 4.4 等常见合法的两位小数金额。
 *
 * @param value 原始输入（string | number | null | undefined）
 * @returns true 当且仅当输入可解析为合法金额格式
 *
 * 合法示例：'12'、'12.3'、'12.34'、'0.29'、'4.4'、'100'
 * 拒绝示例：'1.234'、'1e3'、'-1'、'0.001'、'abc'、''、null、undefined
 */
export function isValidMoneyString(value: unknown): boolean {
  return /^\d+(\.\d{1,2})?$/.test(String(value ?? '').trim())
}
