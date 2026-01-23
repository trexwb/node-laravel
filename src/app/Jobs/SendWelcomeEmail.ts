import { Job } from '#app/Jobs/Job';

interface WelcomeEmailData {
  email: string;
  [key: string]: any; // 支持其他可选字段
}

export class SendWelcomeEmail extends Job {
  protected data: WelcomeEmailData;
  constructor(data: WelcomeEmailData) {
    super();
    this.data = data; // 将数据赋值给实例属性
  }

  public async handle(): Promise<void> {
    console.log(`[Job Executing] 正在为用户 ${this.data.email} 发送欢迎邮件...`);
    // 模拟耗时操作
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`[Job Finished] 邮件发送完毕`);
  }
}