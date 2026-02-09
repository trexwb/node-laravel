/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:57:03
 * @FilePath: /node-laravel/src/app/WebSockets/ChatHandler.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import { WebSocket } from 'ws';

export class ChatHandler {
  public static handle(ws: WebSocket, payload: any) {
    const { user, message } = payload;
    // 广播逻辑可以封装在这里
    console.log(`[WS Chat] ${user}: ${message}`);
    ws.send(JSON.stringify({
      event: 'chat.received',
      data: { status: 'sent', timestamp: Date.now() }
    }));
  }
}