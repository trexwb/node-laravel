/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/tests/unit/signature.test.ts
 * @Description:
 * 签名排序规则单元测试：数字键按数值升序、字符串键字典序、嵌套对象递归排序。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { describe, expect, it } from 'vitest'
import { sortObjectDeep } from '#app/Http/Middleware/VerifySignature'

describe('sortObjectDeep（签名排序规范）', () => {
  it('数字键按数值升序，避免字典序导致 10 < 2', () => {
    const sorted = sortObjectDeep({ '10': 'x', '2': 'y', '1': 'z' }) as Record<string, string>
    expect(Object.keys(sorted)).toEqual(['1', '2', '10'])
  })

  it('字符串键按字典序', () => {
    const sorted = sortObjectDeep({ b: 2, a: 1, c: 3 }) as Record<string, number>
    expect(Object.keys(sorted)).toEqual(['a', 'b', 'c'])
  })

  it('嵌套对象与数组递归排序', () => {
    const input = {
      z: { '10': 'n', '2': 'm', a: 'v' },
      arr: [{ b: 2, a: 1 }],
    }
    const sorted = sortObjectDeep(input) as Record<string, unknown>
    const nested = sorted.z as Record<string, unknown>
    expect(Object.keys(sorted)).toEqual(['arr', 'z'])
    expect(Object.keys(nested)).toEqual(['2', '10', 'a'])
  })
})
