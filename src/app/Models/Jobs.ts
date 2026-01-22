import { BaseModel } from '#app/Models/Base';

export class Jobs extends BaseModel {
  // 显式声明属性，对应数据库字段
  id!: number;
  queue!: string;
  payload!: string;
  attempts!: number;
  reserved_at!: Date | null;
  available_at!: Date;
  created_at!: Date;

  static get tableName() {
    return `${process.env.DB_PREFIX || ''}jobs`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        queue: { type: 'string' },
        text: { type: 'string' },
        attempts: { type: 'integer' }
      }
    };
  }

  // 辅助方法：获取下一条待处理任务
  static async getNextAvailable() {
    return await this.query()
      .where('available_at', '<=', new Date())
      .whereNull('reserved_at')
      .orderBy('id', 'asc')
      .first()
      .forUpdate()
      .skipLocked();
  }
}