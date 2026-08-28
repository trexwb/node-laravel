/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/tests/unit/container.test.ts
 * @Description:
 * Container 单元测试：bind / singleton / instance / has / resolve fallback。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { Container } from '#app/Foundation/Container'

describe('Container', () => {
  beforeEach(() => {
    // 重置容器，避免用例间相互污染
    Container.flush()
  })

  it('bind + resolve 每次生成新实例', () => {
    let count = 0
    Container.bind('svc', () => ({ n: ++count }))
    expect(Container.resolve('svc').n).toBe(1)
    expect(Container.resolve('svc').n).toBe(2)
  })

  it('singleton 缓存同一实例', () => {
    let count = 0
    Container.singleton('svc', () => ({ n: ++count }))
    expect(Container.resolve('svc').n).toBe(1)
    expect(Container.resolve('svc').n).toBe(1)
  })

  it('instance 直接注册值', () => {
    Container.instance('cfg', { env: 'test' })
    expect(Container.resolve('cfg')).toEqual({ env: 'test' })
  })

  it('has 判断已注册', () => {
    expect(Container.has('nothing')).toBe(false)
    Container.bind('x', () => 1)
    expect(Container.has('x')).toBe(true)
  })

  it('未注册时走 fallback，无 fallback 抛错', () => {
    expect(Container.resolve('missing', () => 'fallback')).toBe('fallback')
    expect(() => Container.resolve('missing')).toThrow()
  })
})
