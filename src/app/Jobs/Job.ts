/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:52:29
 * @FilePath: /node-laravel/src/app/Jobs/Job.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import { JobsModel } from '#app/Models/JobsModel';

export abstract class Job {
  // 子类需实现具体的业务逻辑
  abstract handle(): Promise<void>;
  /**
   * 将任务推送到数据库
   */
  public static async dispatch(params: any, delay: number = 0): Promise<void> {
    const payload = {
      className: this.name,
      params: params
    };
    const availableAt = new Date(Date.now() + delay * 1000);
    await JobsModel.createJob(payload, availableAt);
  }
}