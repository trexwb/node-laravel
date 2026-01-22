import { container } from '@bootstrap/app';

export class UserRegistered {
  public static readonly eventName = 'user.registered';

  // 发送事件
  public static dispatch(user: any) {
    container.events.emit(this.eventName, user);
  }

  // 监听事件 (通常在 Provider 中注册)
  public static listen() {
    container.events.on(this.eventName, (user) => {
      // 逻辑 A: 发送邮件
      console.log(`Sending email to ${user.email}`);

      // 逻辑 B: 通过 WebSocket 广播给所有在线管理员
      // 假设 wss 是全局单例或通过 container 注入
      // wss.clients.forEach(...)
    });
  }
}