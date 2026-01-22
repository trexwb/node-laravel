import { Job } from '#app/Jobs/Job';

export class SendWelcomeEmail extends Job {
  constructor(private data: any) {
    super();
  }

  public async handle(): Promise<void> {
    console.log(`[Job Executing] 正在为用户 ${this.data.email} 发送欢迎邮件...`);
    // 模拟耗时操作
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`[Job Finished] 邮件发送完毕`);
  }
}