// src/routes/channels.ts
import { WebSocketServer, WebSocket } from 'ws';
import { ChatHandler } from '#app/WebSockets/ChatHandler';

/**
 * 注册 WebSocket 频道逻辑
 */
export function registerChannels(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    // 1. 连接建立时的鉴权（可选）
    console.log(`[WS] 客户端已连接 (Total: ${wss.clients.size})`);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        const { channel, payload } = message;

        // 2. 根据 channel 字段分发逻辑，类似于 HTTP 的路由匹配
        switch (channel) {
          case 'chat':
            ChatHandler.handle(ws, payload);
            break;

          case 'heartbeat':
            ws.send(JSON.stringify({ event: 'pong' }));
            break;

          default:
            console.warn(`[WS] 未知的频道: ${channel}`);
            ws.send(JSON.stringify({ error: 'Channel not found' }));
        }
      } catch (e) {
        console.error('[WS] 消息格式错误，必须为 JSON');
      }
    });

    ws.on('close', () => {
      console.log('[WS] 客户端已断开');
    });
  });
}