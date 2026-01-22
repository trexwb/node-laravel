import { Jobs } from '#app/Models/Jobs';
import { SendWelcomeEmail } from '#app/Jobs/SendWelcomeEmail';
// 以后每增加一个 Job，手动在这里 import
// import { GenerateInvoice } from '#app/Jobs/GenerateInvoice';

interface JobPayload {
  className: string;
  params: any;
}

/**
 * 任务映射表：将字符串类名映射到真正的类构造函数
 */
const jobRegistry: Record<string, any> = {
  'SendWelcomeEmail': SendWelcomeEmail,
  // 'GenerateInvoice': GenerateInvoice, 
};

export class QueueWorker {
  public static async run() {
    console.log('[Queue] Worker is running...');

    while (true) {
      // 1. 使用 Eloquent ORM 获取任务
      const jobRecord = await Jobs.getNextAvailable();

      if (jobRecord) {
        try {
          // 锁定任务
          await jobRecord.$query().patch({ reserved_at: new Date() } as any);

          const payload = JSON.parse(jobRecord.payload as string);

          // 2. 从注册表中匹配 Job 类
          const JobClass = jobRegistry[payload.className];

          if (!JobClass) {
            throw new Error(`Job class ${payload.className} not found in registry.`);
          }

          // 实例化并执行
          const instance = new JobClass(payload.params);
          await instance.handle();

          // 3. 执行成功后删除任务
          await jobRecord.$query().delete();

          console.log(`[Queue] Job ${payload.className} (ID: ${jobRecord.id}) processed.`);
        } catch (e: any) {
          console.error(`[Queue Error] Job ID ${jobRecord.id} failed:`, e.message);

          // 4. 失败逻辑：增加重试次数并释放锁定
          await jobRecord.$query().patch({
            attempts: (jobRecord.attempts as number) + 1,
            reserved_at: null
          });
        }
      } else {
        // 队列为空，休眠 3 秒
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
}