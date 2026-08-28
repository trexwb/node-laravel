/*
 * @Author: trexwb
 * @Date: 2026-03-30
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-01 13:47:13
 * @FilePath: node-laravel/src/app/Events/BaseEvent.ts
 * @Description:
 * 事件基类 - 统一事件名称、Payload 约束、toJSON 序列化
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { eventBus } from '#bootstrap/events'

/** 事件基类：统一事件名称、Payload 约束、toJSON 序列化 */
export abstract class BaseEvent<T = Record<string, unknown>> {
  /** 子类必须声明唯一事件名 */
  public static readonly eventName: string

  // ✅ 修改点：1. 显式声明属性
  public readonly payload: T

  // ✅ 修改点：2. 在构造函数中赋值
  constructor(payload: T) {
    this.payload = payload
  }

  /** 序列化支持（入 Redis/RabbitMQ 队列） */
  toJSON(): object {
    return {
      event: (this.constructor as typeof BaseEvent).eventName,
      timestamp: new Date().toISOString(),
      payload: this.payload,
    }
  }

  /** 同步触发（解耦 Controller） */
  dispatch(): void {
    eventBus.emit((this.constructor as typeof BaseEvent).eventName, this.payload)
  }
}
