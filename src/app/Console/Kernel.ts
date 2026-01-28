// import schedule from 'node-schedule';
// import { container } from '#bootstrap/app';

export class Kernel {
  /**
   * 定义应用的计划任务
   */
  public static schedule() {
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
  }
}