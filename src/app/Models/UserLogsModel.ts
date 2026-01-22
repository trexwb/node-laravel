import { BaseModel } from '#app/Models/BaseModel';
import { User } from '#app/Models/UserModel';
import { Model } from 'objection';

// 示例：app/Models/User.ts
export class UsersLogs extends BaseModel {
  static get tableName() {
    return `${process.env.DB_PREFIX || ''}users_logs`;
  }

  // 对应 Laravel 的 $casts 和 $fillable
  // Objection 使用 JSON Schema 进行校验和自动格式化
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'handle'], // 必填字段
      properties: {
        id: { type: 'integer' },
        userId: { type: 'integer' },
        handle: { type: 'string' },
        // sourceData 会被自动当作 JSON 处理
        sourceData: { type: 'object' },
      }
    };
  }

  // 对应 Laravel 的 belongsTo (真正的关联！)
  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'users_logs.user_id',
          to: 'users.id'
        }
      }
    };
  }

  // 访问器 (Accessor) 示例
  // Objection 直接使用 JS 的 get/set 语法
  get displayHandle() {
    return `Action: ${(this as any).handle}`;
  }
}