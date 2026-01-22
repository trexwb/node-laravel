import { BaseModel } from '#app/Models/BaseModel';

// 示例：app/Models/User.ts
export class User extends BaseModel {
  static get tableName() {
    return `${process.env.DB_PREFIX || ''}users`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        // 替代 new CastBoolean()
        isActive: { type: 'boolean' },
        // 替代 new CastInteger()
        level: { type: 'integer' }
      }
    };
  }
}