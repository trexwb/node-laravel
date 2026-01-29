import { CacheService } from '#app/Services/Cache/CacheService';
export class CacheTask {
  public static async run() {
    console.log('[CacheTask]定时任务执行时间:', new Date());
    await CacheService.flush();
  }
}