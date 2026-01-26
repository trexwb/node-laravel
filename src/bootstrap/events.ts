import { EventEmitter } from 'node:events';

// 创建全局事件总线
export const eventBus = new EventEmitter();