import { container } from '#bootstrap/app';

export abstract class Job {
  // 子类需实现具体的业务逻辑
  abstract handle(): Promise<void>;

  /**
   * 将任务推送到数据库
   */
  public static async dispatch(params: any, delay: number = 0): Promise<void> {
    const payload = JSON.stringify({
      className: this.name,
      params: params
    });

    const availableAt = new Date(Date.now() + delay * 1000);

    await container.db('jobs').insert({
      queue: 'default',
      payload: payload,
      available_at: availableAt,
      attempts: 0
    });
  }
}