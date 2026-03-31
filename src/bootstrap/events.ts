/*
 * @Author: trexwb
 * @Date: 2026-03-27 11:30:00
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 13:45:00
 * @FilePath: /node-laravel/src/bootstrap/events.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import { EventEmitter } from 'node:events';
import { config } from '#bootstrap/configLoader';

// ============================================================
// 基础事件总线（单进程内使用）
// ============================================================
class LocalEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }
}

export const eventBus = new LocalEventBus();

// ============================================================
// 跨进程事件总线（Cluster 模式使用 Redis Pub/Sub）
// ============================================================
interface CrossProcessBusOptions {
  channel: string;
  redisUrl?: string;
}

type EventHandler = (...args: any[]) => void;

let redisClient: any = null;
let redisSubscriber: any = null;
let crossProcessBus: any = null;

async function getRedisClient() {
  if (redisClient) return redisClient;

  const redisEnabled = config('cache.driver') === 'redis' && config('cache.host');
  if (!redisEnabled) {
    return null;
  }

  try {
    const { createClient } = await import('redis');
    const host = config('cache.host');
    const port = config('cache.port');
    const password = config('cache.passwd');

    redisClient = createClient({
      password: password || undefined,
      socket: { host, port },
    });
    redisClient.on('error', (err: Error) => {
      console.error('[CrossProcessBus] Redis Client Error:', err.message);
    });
    await redisClient.connect();
    console.log('[CrossProcessBus] Redis 连接成功');
    return redisClient;
  } catch (err) {
    console.warn('[CrossProcessBus] Redis 连接失败，跨进程事件将不可用:', (err as Error).message);
    return null;
  }
}

async function getRedisSubscriber() {
  if (redisSubscriber) return redisSubscriber;
  const client = await getRedisClient();
  if (!client) return null;

  redisSubscriber = client.duplicate();
  await redisSubscriber.connect();
  return redisSubscriber;
}

/**
 * 创建跨进程事件总线（需 Redis 支持）
 * 返回的对象提供 publish() 和 subscribe() 方法
 */
export async function createCrossProcessEventBus(options: CrossProcessBusOptions) {
  if (crossProcessBus) return crossProcessBus;

  const subscriber = await getRedisSubscriber();
  if (!subscriber) {
    console.warn('[CrossProcessBus] Redis 不可用，返回空实现');
    return {
      publish: async (_channel: string, _data: any) => {},
      subscribe: (_channel: string, _handler: EventHandler) => {},
    };
  }

  const localHandlers = new Map<string, EventHandler[]>();

  // 订阅 Redis 频道，收到消息后分发给本地处理器
  await subscriber.subscribe(options.channel, (message: string) => {
    try {
      const { event, args } = JSON.parse(message);
      const handlers = localHandlers.get(event) || [];
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (e) {
          console.error(`[CrossProcessBus] Handler error for event "${event}":`, e);
        }
      });
    } catch (e) {
      console.error('[CrossProcessBus] 消息解析失败:', e);
    }
  });

  crossProcessBus = {
    /**
     * 向所有进程广播事件
     */
    publish: async (event: string, ...args: any[]) => {
      // 1. 本地进程直接触发
      eventBus.emit(event, ...args);
      // 2. 跨进程广播（通过 Redis）
      const publisher = await getRedisClient();
      if (publisher) {
        await publisher.publish(options.channel, JSON.stringify({ event, args }));
      }
    },

    /**
     * 注册监听器（同时支持本地和跨进程）
     */
    subscribe: (event: string, handler: EventHandler) => {
      if (!localHandlers.has(event)) {
        localHandlers.set(event, []);
      }
      localHandlers.get(event)!.push(handler);
    },
  };

  console.log(`[CrossProcessBus] 跨进程事件总线已就绪 (channel: ${options.channel})`);
  return crossProcessBus;
}

/**
 * 快捷方法：broadcast() — 跨进程广播
 * 注意：需要在启动后调用 createCrossProcessEventBus() 初始化
 */
export async function broadcast(event: string, ...args: any[]) {
  if (crossProcessBus) {
    await crossProcessBus.publish(event, ...args);
  } else {
    eventBus.emit(event, ...args);
  }
}
