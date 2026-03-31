/**
 * @Author: trexwb
 * @Date: 2026-03-27 11:30:00
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 13:45:00
 * @FilePath: /node-laravel/src/bootstrap/websocket.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 * 
 * WebSocket 独立进程服务器
 * 用于 Cluster 模式下的 standalone 模式
 */
import { WebSocketServer, WebSocket } from 'ws';
import http from 'node:http';
import { registerChannels } from '#routes/channels';
import { logger } from '#utils/Logger';
import { createCrossProcessEventBus } from '#bootstrap/events';
import { config } from '#bootstrap/configLoader';

/**
 * 创建独立 WebSocket 服务器
 * @param port WebSocket 监听端口（默认从 config 读取或 8080）
 */
export async function createStandaloneWebSocketServer(port?: number): Promise<http.Server> {
  const wsPort = port || config('app.ws.port') || 8080;
  const server = http.createServer();

  const wss = new WebSocketServer({ server });

  // 注册频道路由
  registerChannels(wss);

  // 初始化跨进程事件总线（用于广播消息）
  const bus = await createCrossProcessEventBus({ channel: 'ws:broadcast' });

  // 订阅跨进程消息并分发给本地连接的客户端
  bus.subscribe('ws:broadcast', (data: { channel: string; payload: any; excludePid?: number }) => {
    if (data.excludePid === process.pid) return;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          channel: data.channel,
          payload: data.payload,
          event: 'server:broadcast',
          timestamp: Date.now(),
        }));
      }
    });
  });

  server.listen(wsPort, () => {
    logger.info(`[WS Standalone] WebSocket 服务器已启动，端口: ${wsPort}`);
  });

  server.on('error', (err) => {
    logger.error(`[WS Standalone] 服务器错误: ${err.message}`);
  });

  return server;
}

/**
 * 向指定 Room 广播消息（跨进程）
 * @param room 房间/频道名
 * @param message 消息内容
 */
export async function broadcastToRoom(room: string, message: any) {
  const { broadcast } = await import('#bootstrap/events');
  await broadcast('ws:broadcast', {
    channel: room,
    payload: message,
    timestamp: Date.now(),
  });
}
