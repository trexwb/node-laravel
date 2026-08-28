/*
 * @Author: trexwb
 * @Date: 2026-08-13
 * @FilePath: node-laravel/src/app/Http/Controllers/WebSocket/ChannelController.ts
 * @Description:
 * WebSocket 频道控制器，负责消息解析、频道分发与错误处理
 * 框架版：业务频道处理器由业务方通过 Container 注册 channel.handlers 注入，不依赖业务 Handler
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { Container } from '#app/Foundation/Container'
import { WebSocket, WebSocketServer, type RawData } from 'ws'
import type { ChannelMessageHandlers } from '#types/framework'

export class ChannelController {
  /**
   * 处理新连接，注册消息/关闭事件
   */
  public static handleConnection(wss: WebSocketServer): void {
    wss.on('connection', (ws: WebSocket) => {
      ws.on('message', (data: RawData) => ChannelController.handleMessage(ws, data))
      ws.on('close', () => {
        console.log('[WS] 客户端已断开')
      })
    })
  }

  /**
   * 解析消息 JSON 并分发到对应频道处理器
   */
  private static handleMessage(ws: WebSocket, data: RawData): void {
    try {
      // ws 消息可能为 Buffer / Buffer[] / ArrayBuffer，统一归一化为文本
      const text = Array.isArray(data)
        ? Buffer.concat(data).toString()
        : Buffer.isBuffer(data)
          ? data.toString()
          : Buffer.from(data).toString()
      const message = JSON.parse(text)
      const { channel, payload } = message

      // 业务频道处理器通过 channel.handlers 注入，key 为频道名
      const handlers = Container.resolve<ChannelMessageHandlers>('channel.handlers', () => ({}))
      const handler = handlers[channel as string]
      if (handler) {
        handler(ws, payload)
        return
      }

      switch (channel) {
        case 'heartbeat':
          ws.send(JSON.stringify({ event: 'pong' }))
          break
        default:
          console.warn(`[WS] 未知的频道: ${channel}`)
          ws.send(JSON.stringify({ error: 'Channel not found' }))
      }
    } catch {
      console.error('[WS] 消息格式错误，必须为 JSON')
    }
  }
}
