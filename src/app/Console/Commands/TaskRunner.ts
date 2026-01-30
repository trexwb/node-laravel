import { createRequire } from 'node:module';
import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
// import { config } from '#bootstrap/configLoader';
import { eventBus } from '#bootstrap/events';
import { pathToFileURL } from 'node:url';
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
        function assertSafe(command: string) {
          const forbidden = ['..', 'rm', 'sudo', '&&', '|', ';', '$(', '`'];
          if (forbidden.some(k => command.includes(k))) {
            throw new Error('Unsafe command');
          }
        }
        assertSafe(handler.comment);
        const SAFE_EXEC_DIR = path.resolve(process.cwd(), 'src');
        await execAsync(handler.comment, { cwd: SAFE_EXEC_DIR, timeout: 60000 });
      } else if (handler.script) {
        // 传递我们创建的 localRequire 给动态脚本
        const func = new Function('require', 'console', handler.script);
        await func(localRequire, console);
      } else if (handler.require) {
        // 2. 使用 path.resolve 确保路径绝对正确
        const baseModulePath = path.resolve(process.cwd(), 'src/app/Console/Schedules', handler.require);
        let taskModule: any;
        let found = false;
        // 优先 .ts（开发），再 .js（生产）
        for (const ext of ['.ts', '.js']) {
          const fullPath = baseModulePath + ext;
          try {
            await fs.promises.access(fullPath); // 文件存在
            const moduleUrl = pathToFileURL(fullPath).href + `?t=${Date.now()}`;
            taskModule = await import(moduleUrl);
            found = true;
            break;
          } catch {
            // 文件不存在，继续
          }
        }
        if (!found) {
          throw new Error(`Task module not found: ${handler.require} (.ts or .js)`);
        }
        // 支持多种导出格式
        if (typeof taskModule === 'function') {
          await taskModule();
        } else if (taskModule && typeof taskModule.handle === 'function') {
          await taskModule.handle();
        } else if (taskModule && typeof taskModule.default === 'function') {
          await taskModule.default();
        } else {
          throw new Error(`Module does not export a runnable function: ${handler.require}`);
        }
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