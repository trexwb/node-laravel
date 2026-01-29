import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { eventBus } from '#bootstrap/events';
const execAsync = promisify(exec);

export class TaskRunner {
  /**
   * 统一任务执行入口
   */
  static async run(taskId: string, name: string, handler: any, time: string) {
    // const start = Date.now();
    let status = 0;
    console.log(`[Task Start] ID: ${taskId} | Name: ${name}`);

    try {
      status = 2;
      if (handler.comment) {
        // 使用非阻塞的 exec
        await execAsync(handler.comment, { timeout: 60000 });
      } else if (handler.script) {
        // 建议传递 container 等上下文进去
        const func = new Function('require', 'console', handler.script);
        await func(require, console);
      } else if (handler.require) {
        const modulePath = require.resolve(`#app/Console/Schedules/${handler.require}`);
        const taskModule = require(modulePath);
        // 支持导出为函数或包含 handle 方法的对象
        typeof taskModule === 'function' ? await taskModule() : await taskModule.handle();
        delete require.cache[modulePath];
      }
      status = 1;
      // const duration = Date.now() - start;
      // console.log(`[Task Success] ID: ${taskId} | Duration: ${duration}ms`);
    } catch (err: any) {
      status = 3;
      handler = err.message;
      // 这里可以扩展：写入数据库任务日志表
    } finally {
      eventBus.emit('writeLogs', { id: taskId, name, time, handler }, { status }, 'schedules_taskRunner');
    }
  }
}