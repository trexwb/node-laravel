/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:52:34
 * @FilePath: /node-laravel/src/app/Jobs/SendWelcomeEmail.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
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