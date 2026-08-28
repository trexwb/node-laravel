/*
 * @Author: trexwb
 * @Date: 2026-03-30
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-30
 * @FilePath: node-laravel/src/app/Listeners/BaseListener.ts
 * @Description:
 * 监听器基类 - 统一事件监听模式
 * 一花一世界，一叶如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { eventBus } from '#bootstrap/events'

/** 监听器基类：统一监听模式、错误处理、日志输出 */
export class BaseListener {
  /** 事件名称（子类必须声明） */
  protected static readonly eventName: string

  /** 防止重复注册 */
  private static _listening = false

  /** 是否已注册 */
  protected static get listening(): boolean {
    return this._listening
  }

  /**
   * 注册事件监听（整个进程只执行一次）
   * 子类只需实现 handle 方法
   * @param eventName 事件名称
   * @param handler 处理函数
   */
  protected static listenOn(eventName: string, handler: (payload: unknown) => Promise<void>): void {
    if (this._listening) return
    this._listening = true

    eventBus.on(eventName, (payload: unknown) => {
      handler(payload).catch((err) => {
        console.error(`[${this.name}] handle error:`, err)
      })
    })
  }

  /**
   * 便捷方法：批量执行任务，忽略失败
   * @param tasks 任务数组
   */
  protected static async executeAll(tasks: Promise<unknown>[]): Promise<void> {
    await Promise.allSettled(tasks)
  }

  /**
   * 便捷方法：执行任务并捕获错误
   * @param fn 异步函数
   * @param errorMsg 错误信息前缀
   */
  protected static async safeExecute<T>(fn: () => Promise<T>, errorMsg: string): Promise<T | null> {
    try {
      return await fn()
    } catch (err) {
      console.error(`[this.name] ${errorMsg}:`, err)
      return null
    }
  }
}
