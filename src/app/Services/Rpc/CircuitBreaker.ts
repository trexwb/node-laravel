/*
 * @Author: trexwb
 * @Date: 2026-02-09 11:07:29
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:53:45
 * @FilePath: /node-laravel/src/app/Services/Rpc/CircuitBreaker.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
type State = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreaker {
  private state: State = "CLOSED";
  private failures = 0;
  private lastFailureTime = 0;
  private threshold: number;
  private resetTimeout: number;

  constructor(threshold: number = 3, resetTimeout: number = 5000) {
    this.threshold = threshold;
    this.resetTimeout = resetTimeout;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (
        Date.now() - this.lastFailureTime >
        this.resetTimeout
      ) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit open");
      }
    }

    try {
      const result = await fn();
      this.success();
      return result;
    } catch (err) {
      this.failure();
      throw err;
    }
  }

  private success() {
    this.failures = 0;
    this.state = "CLOSED";
  }

  private failure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = "OPEN";
      this.lastFailureTime = Date.now();
    }
  }

  getState() {
    return this.state;
  }
}
