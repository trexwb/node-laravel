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