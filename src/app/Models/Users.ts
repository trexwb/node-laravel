import { QueryBuilder } from 'objection';
import { config } from '#bootstrap/configLoader';
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
    return `${config('database.prefix')}users`;
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

  // 多条查询（分页）
  static async findMany(
    filters: Parameters<typeof this.buildQuery>[1],
    options: { page?: number; perPage?: number } = {}
  ) {
    const { page = 1, perPage = 10 } = options;
    const offset = (page - 1) * perPage;
    const baseQuery = this.buildQuery(this.query(), filters).orderBy('id', 'asc');
    const totalCount = await baseQuery.resultSize();
    const items = await baseQuery.clone().limit(perPage).offset(offset);
    return {
      data: items,
      meta: {
        total: totalCount,
        page,
        perPage,
        totalPages: Math.ceil(totalCount / perPage),
      },
    };
  }

  // 创建任务
  static async createUser(data: Record<string, any>): Promise<Users> {
    return await this.query().insert({
      nickname: data.nickname || '',
      email: data.email || '',
      mobile: data.mobile || '',
      avatar: data.avatar || '',
      password: data.password || '',
      salt: data.salt || '',
      rememberToken: data.rememberToken || '',
      uuid: data.uuid || '',
      secret: data.secret || '',
      extension: data.extension || {},
      status: data.status || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning('*').first();
  }

  // 更新（带条件）
  static async updateByFilters(
    filters: Parameters<typeof this.buildQuery>[1],
    data: Partial<Users>
  ) {
    const query = this.buildQuery(this.query(), filters);
    return await query.patch(data); // 返回受影响行数
  }

  // 删除（带条件）
  static async deleteByFilters(filters: Parameters<typeof this.buildQuery>[1]) {
    const query = this.buildQuery(this.query(), filters);
    return await query.delete(); // 返回受影响行数
  }
}