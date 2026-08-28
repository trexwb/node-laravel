import type { CircuitBreakerState } from '#types/rpc'
/*
 * @Author: trexwb
 * @Date: 2026-02-09
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09
 * @FilePath: node-laravel/src/app/Services/Rpc/CircuitBreaker.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED'
  private failures = 0
  private lastFailureTime = 0
  private threshold: number
  private resetTimeout: number

  /**
   * 初始化熔断器实例。
   * @param {number} [threshold=3] - 失败次数阈值，达到后熔断器打开
   * @param {number} [resetTimeout=5000] - 熔断器打开后重置的超时时间（毫秒）
   */
  constructor(threshold: number = 3, resetTimeout: number = 5000) {
    this.threshold = threshold
    this.resetTimeout = resetTimeout
  }

  /**
   * 在熔断器保护下执行异步函数。
   * 若熔断器处于 OPEN 状态且未超时，直接抛出错误；否则执行函数并更新状态。
   * @param {() => Promise<T>} fn - 要执行的异步函数
   * @returns {Promise<T>} 函数执行结果
   * @throws {Error} 当熔断器打开时抛出 "Circuit open"；或透传 fn 的异常
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit open')
      }
    }

    try {
      const result = await fn()
      this.success()
      return result
    } catch (err) {
      this.failure()
      throw err
    }
  }

  /**
   * 标记执行成功，重置失败计数并关闭熔断器。
   * @returns {void}
   */
  private success() {
    this.failures = 0
    this.state = 'CLOSED'
  }

  /**
   * 标记执行失败，累加失败计数；若达到阈值则打开熔断器。
   * @returns {void}
   */
  private failure() {
    this.failures++
    if (this.failures >= this.threshold) {
      this.state = 'OPEN'
      this.lastFailureTime = Date.now()
    }
  }

  /**
   * 获取当前熔断器状态。
   * @returns {CircuitBreakerState} 当前状态：CLOSED / OPEN / HALF_OPEN
   */
  getCircuitBreakerState() {
    return this.state
  }
}
