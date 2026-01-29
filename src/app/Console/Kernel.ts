import schedule from 'node-schedule';
import { TaskRunner } from '#app/Console/Commands/TaskRunner';
import { SchedulesService } from '#app/Services/Schedules/SchedulesService';
import Utils from '#utils/index';

export class Kernel {
  static taskJobs = new Map<string, { job: schedule.Job; time: string }>();
  static isInitializing = false;
  /**
   * 定义应用的计划任务
   */
  public static async schedule() {
    // // 示例 1: 每分钟执行一次 (Laravel 风格: * * * * *)
    // schedule.scheduleJob('* * * * *', () => {
    //   console.log(`[Scheduled Task] 执行系统健康检查: ${new Date().toISOString()}`);
    //   // 这里可以触发事件或调用 Service
    //   container.events.emit('system:check');
    // });

    // // 示例 2: 每天凌晨执行 (0 0 * * *)
    // schedule.scheduleJob('0 0 * * *', async () => {
    //   console.log('[Scheduled Task] 开始清理过期日志...');
    //   // await LogService.cleanup();
    // });

    // // 示例 3: 使用对象配置执行 (每小时第30分钟)
    // const rule = new schedule.RecurrenceRule();
    // rule.minute = 30;
    // schedule.scheduleJob(rule, () => {
    //   console.log('[Scheduled Task] 每一个小时的 30 分执行一次');
    // });
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      const taskData = (await SchedulesService.findAll())?.data || [];
      const activeIds = new Set<string>();
      if (Array.isArray(taskData)) {
        for (const row of taskData) {
          const id = String(row.id);
          if (row.status !== 1 || !Utils.isValidCronFormatFlexible(row.time)) {
            continue;
          }
          activeIds.add(id);
          const existing = this.taskJobs.get(id);
          // 如果 Cron 表达式变了，或者任务还没创建
          if (!existing || existing.time !== row.time) {
            if (existing) {
              existing.job.cancel();
              console.log(`[Scheduler] 任务 ${id} 配置变更，重启中...`);
            }
            // 创建新的调度
            const newJob = schedule.scheduleJob(row.time, async () => {
              await TaskRunner.run(id, row.name, row.handler, row.time);
            });
            if (newJob) {
              this.taskJobs.set(id, { job: newJob, time: row.time });
              console.log(`[Scheduler] 任务 ${id} 已挂载: ${row.time}`);
            }
          }
        }
      }
      // 自动清理：删除那些不在数据库 active 列表中的任务
      for (const [id, { job }] of this.taskJobs.entries()) {
        if (!activeIds.has(id)) {
          job.cancel();
          this.taskJobs.delete(id);
          console.log(`[Scheduler] 任务 ${id} 已停用/删除，释放资源`);
        }
      }
    } catch (err: any) {
      console.error('[Scheduler Critical Error]:', err.message);
    } finally {
      this.isInitializing = false;
      // 保持心跳
      setTimeout(() => this.schedule(), 30000); // 缩短为30秒检查一次更灵敏
    }
  }
}