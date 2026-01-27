import { BaseModel } from '#app/Models/BaseModel';
import { UsersModel } from '#app/Models/UsersModel';
import { config } from '#bootstrap/configLoader';
import { Model } from 'objection';

export class UsersLogsModel extends BaseModel {
  // 显式声明属性，对应数据库字段
  id!: number;
  userId!: number;
  source!: object;
  handle!: string;
  updatedAt!: Date;
  createdAt!: Date;
  static softDelete = false;

  static get tableName() {
    return `${config('database.prefix')}users_logs`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'handle'], // 必填字段
      properties: {
        userId: { type: 'integer' },
        source: { type: 'object' },
        handle: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      }
    };
  }

  // 定义 JSON 字段（Objection 会自动序列化/反序列化）
  static get jsonAttributes() {
    return ['source'];
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: UsersModel,
        join: {
          from: `${this.tableName}}.user_id`,
          to: `${UsersModel.tableName}.id`
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