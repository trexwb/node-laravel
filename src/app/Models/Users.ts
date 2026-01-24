import { QueryBuilder } from 'objection';
import { BaseModel } from '#app/Models/Base';

export class Users extends BaseModel {
  // 显式声明属性，对应数据库字段
  id!: number;
  nickname!: string;
  email!: string;
  mobile!: string;
  avatar!: string;
  password!: string;
  salt!: string;
  rememberToken!: string;
  uuid!: string;
  secret!: string;
  extension!: object;
  status!: number;
  updatedAt!: Date;
  createdAt!: Date;
  deletedAt!: Date | null;
  static get tableName() {
    return `${process.env.DB_PREFIX || ''}users`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        nickname: { type: 'string' },
        email: { type: 'string' },
        mobile: { type: 'string' },
        avatar: { type: 'string' },
        password: { type: 'string' },
        salt: { type: 'string' },
        remember_token: { type: 'string' },
        uuid: { type: 'string' },
        secret: { type: 'string' },
        extension: { type: 'object' },
        // isActive: { type: 'boolean' },
        status: { type: 'integer' }
      }
    };
  }

  // 👇 核心：通用查询构建器（返回 QueryBuilder）
  static buildQuery(
    qb: QueryBuilder<Users> = this.query(),
    filters: {
      id?: number;
      nickname?: string;
      email?: string;
      emmobileail?: string;
      remember_token?: string;
      uuid?: string;
      status?: number;
    } = {},
    trashed: boolean = false
  ): QueryBuilder<Users> {
    let query = qb;
    function applyWhereCondition(field: string, value: any) {
      if (Array.isArray(value)) {
        if (value.length > 0) query.whereIn(field, value);
      } else if (value) {
        query.where(field, value);
      }
    }
    if (filters.id != null) {
      applyWhereCondition('id', filters.id);
    }
    if (trashed) {
      query.whereNotNull('deleted_at');
    } else {
      query.whereNull('deleted_at');
    }
    return query;
  }

  // 单条查询（非 ID）
  static async findOne(filters: Parameters<typeof this.buildQuery>[1]) {
    const query = this.buildQuery(this.query(), filters);
    return await query.first(); // 或 .limit(1).first()
  }
}