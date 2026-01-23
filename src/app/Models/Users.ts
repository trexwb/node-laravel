import { BaseModel } from '#app/Models/Base';

export class Users extends BaseModel {
  static get tableName() {
    return `${process.env.DB_PREFIX || ''}users`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        isActive: { type: 'boolean' },
        level: { type: 'integer' }
      }
    };
  }

  // 创建任务
  static async create(payload: Record<string, any>, availableAt?: Date): Promise<Users> {
    return await this.query().insert({
      queue: payload.queue || 'default', // 修正：使用 queue 而不是 name
      payload: JSON.stringify(payload), // 修正：payload 应该是字符串类型
      attempts: 0,
      availableAt: availableAt || new Date(),
    }).returning('*').first(); // 添加 returning 以获取插入的记录
  }
}