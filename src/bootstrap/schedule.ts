import { Kernel } from '#app/Console/Kernel';
import cluster from 'node:cluster';

/**
 * 启动计划任务
 * 建议只在 Master 进程或特定的 Worker 进程启动，避免重复执行
 */

export function bootScheduling() {
  if (cluster.isPrimary) {
    Kernel.schedule();
    console.log('[Scheduler] 计划任务调度器已启动');
  }
}