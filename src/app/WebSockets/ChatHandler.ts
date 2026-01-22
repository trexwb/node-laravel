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