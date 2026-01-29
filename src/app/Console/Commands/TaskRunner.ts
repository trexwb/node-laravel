import { createRequire } from 'node:module';
import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { eventBus } from '#bootstrap/events';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

// 1. 重命名 require 避免与全局/编译环境冲突
const localRequire = createRequire(import.meta.url);

export class TaskRunner {
  /**
   * 统一任务执行入口
   */
  static async run(taskId: string, name: string, handler: any, time: string) {
    let status = 0;
    let stdout = 'wait';
    console.log(`[Task Start] ID: ${taskId} | Name: ${name}`);
    try {
      status = 2; // 运行中
      if (handler.comment) {
        await execAsync(handler.comment, { timeout: 60000 });
      } else if (handler.script) {
        // 传递我们创建的 localRequire 给动态脚本
        const func = new Function('require', 'console', handler.script);
        await func(localRequire, console);
      } else if (handler.require) {
        // 2. 使用 path.resolve 确保路径绝对正确
        // 注意：localRequire.resolve 是相对于当前文件路径解析的
        const modulePath = path.resolve(__dirname, '../Schedules', handler.require);
        // const modulePath = localRequire.resolve(path.join(process.cwd(), 'src/app/Console/Schedules', handler.require));
        // console.log(`[Task Info] Loading module: ${modulePath}`);
        let taskModule: any;
        try {
          taskModule = await import(modulePath + `?t=${Date.now()}`);
        } catch (e) {
          taskModule = localRequire(modulePath);
        }
        // 支持多种导出格式
        if (typeof taskModule === 'function') {
          await taskModule();
        } else if (taskModule && typeof taskModule.handle === 'function') {
          await taskModule.handle();
        } else if (taskModule && typeof taskModule.default === 'function') {
          await taskModule.default();
        }
        // 3. 清理缓存，确保下一次执行时加载的是最新代码（如果是动态修改脚本的需求）
        delete localRequire.cache[modulePath];
      }
      status = 1; // 成功
      stdout = 'success';
    } catch (err) {
      status = 3; // 失败
      stdout = (err as Error).message;
      // console.error(`[Task Error] ID: ${taskId}:`, err);
    } finally {
      // 这里的 eventBus 会触发你之前的日志写入逻辑
      eventBus.emit('writeLogs', { id: taskId, name, time, handler }, { stdout, status }, 'schedules_taskRunner');
    }
  }
}