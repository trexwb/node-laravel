import { eventBus } from '#bootstrap/events';
import { BaseModel } from '#app/Models/BaseModel';
import { UsersLogsModel } from '#app/Models/UsersLogsModel';
import { SecretsLogsModel } from '#app/Models/SecretsLogsModel';
import { SchedulesLogsModel } from '#app/Models/SchedulesLogsModel';

/**
 * 1️⃣ 统一定义 Handle
 */
export const WriteLogHandle = {
  AuthorizeSignIn: 'authorize_signIn',
  AuthorizeSignSecret: 'authorize_signSecret',
  AuthorizeSignOut: 'authorize_signOut',
  SecretsUpdate: 'secrets_modify',
  SchedulesTaskRunner: 'schedules_taskRunner',
} as const;

export type WriteLogHandle = typeof WriteLogHandle[keyof typeof WriteLogHandle];

type LogSource = { id: number;[key: string]: unknown; };
type LogRule = {
  model: typeof BaseModel;
  foreignKey: 'userId' | 'secretId' | 'scheduleId';
};
const logRules: Record<WriteLogHandle, LogRule> = {
  authorize_signIn: {
    model: UsersLogsModel,
    foreignKey: 'userId',
  },
  authorize_signSecret: {
    model: UsersLogsModel,
    foreignKey: 'userId',
  },
  authorize_signOut: {
    model: UsersLogsModel,
    foreignKey: 'userId',
  },
  secrets_modify: {
    model: SecretsLogsModel,
    foreignKey: 'secretId',
  },
  schedules_taskRunner: {
    model: SchedulesLogsModel,
    foreignKey: 'scheduleId',
  },
};

type LogHandle = { [key: string]: unknown; };;

const clone = <T>(data: T): T => structuredClone ? structuredClone(data) : JSON.parse(JSON.stringify(data));

export class WriteLogsEvents {
  static readonly eventName = 'writeLogs';
  private static listening = false;
  static dispatch(
    source: LogSource,
    handle: LogHandle,
    action: WriteLogHandle,
  ) {
    eventBus.emit(this.eventName, source, handle, action);
  }

  static listen() {
    if (this.listening) return;
    this.listening = true;
    eventBus.on(
      this.eventName,
      async (source: LogSource, handle: LogHandle, action: WriteLogHandle) => {
        const rule = logRules[action];
        if (!rule) return;
        const { model, foreignKey } = rule;
        await model.insert({
          source: clone(source),
          handle: { ...clone(handle), action },
          [foreignKey]: Number(source.id),
        });
      }
    );
  }
}
