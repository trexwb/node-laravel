import { eventBus } from '#bootstrap/events';
import { UsersLogsModel } from '#app/Models/UsersLogsModel';

export const UserLogHandle = {
  AuthorizeSignIn: 'authorize_signIn',
  AuthorizeSignSecret: 'authorize_signSecret',
  AuthorizeSignOut: 'authorize_signOut',
} as const;

export type UserLogHandle = typeof UserLogHandle[keyof typeof UserLogHandle];

export class WriteLogsEvents {
  public static readonly eventName = 'writeLogs';

  // 发送事件
  public static dispatch<H extends UserLogHandle>(
    source: {
      id: number;
      [key: string]: any;
    },
    handle: H
  ): void {
    eventBus.emit(this.eventName, source, handle);
  }

  // 监听事件 (通常在 Provider 中注册)
  public static listen() {
    const handleModel = {
      'authorize_signIn': UsersLogsModel,
      'authorize_signSecret': UsersLogsModel,
      'authorize_signOut': UsersLogsModel
    };
    eventBus.on(this.eventName, (source, handle) => {
      const safeSource = JSON.parse(JSON.stringify(source));
      if (handle in handleModel && handleModel[handle as keyof typeof handleModel]) {
        const model = handleModel[handle as keyof typeof handleModel];
        model.create({
          userId: Number(source.id),
          source: safeSource,
          handle: handle,
        });
      }
    });
  }
}