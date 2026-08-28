/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/app/Foundation/Container.ts
 * @Description:
 * 轻量服务容器 — 仿 Laravel Service Container
 * 框架层仅依赖抽象接口，业务实现通过本容器注册/注入，从而解除框架与业务代码的耦合。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

// resolver 必须为同步函数：resolve() 是同步方法，异步 resolver（返回 Promise）会被当作实例缓存，
// 造成类型与运行时不一致。需异步初始化时请显式初始化后再用 instance() 注册。
type Resolver<T> = () => T

interface Binding<T> {
  resolver: Resolver<T>
  singleton: boolean
  instance?: T
}

export class Container {
  private static bindings = new Map<string, Binding<unknown>>()

  /**
   * 注册一个普通绑定（每次 resolve 都会重新执行 resolver）
   */
  static bind<T>(key: string, resolver: Resolver<T>): void {
    this.bindings.set(key, { resolver, singleton: false })
  }

  /**
   * 注册一个单例绑定（首次 resolve 后缓存实例）
   */
  static singleton<T>(key: string, resolver: Resolver<T>): void {
    this.bindings.set(key, { resolver, singleton: true })
  }

  /**
   * 直接绑定一个已实例化的值（单例）
   */
  static instance<T>(key: string, value: T): void {
    this.bindings.set(key, { resolver: () => value, singleton: true, instance: value })
  }

  /**
   * 判断是否已注册指定 key
   */
  static has(key: string): boolean {
    return this.bindings.has(key)
  }

  /**
   * 解析绑定；未注册时可提供 fallback 兜底，否则抛错
   */
  static resolve<T>(key: string, fallback?: () => T): T {
    const binding = this.bindings.get(key)
    if (!binding) {
      if (fallback) return fallback()
      throw new Error(`[Container] No binding registered for "${key}"`)
    }
    if (binding.singleton && binding.instance !== undefined) {
      return binding.instance as T
    }
    const resolved = binding.resolver() as T
    if (binding.singleton) {
      binding.instance = resolved
    }
    return resolved
  }

  /**
   * 移除指定绑定
   */
  static forget(key: string): void {
    this.bindings.delete(key)
  }

  /**
   * 清空所有绑定
   */
  static flush(): void {
    this.bindings.clear()
  }
}
