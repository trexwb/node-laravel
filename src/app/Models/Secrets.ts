import { QueryBuilder } from 'objection';
import { BaseModel } from '#app/Models/Base';

export class Secrets extends BaseModel {
  // 显式声明属性，对应数据库字段
  id!: number;
  title!: string;
  appId!: number;
  appSecret!: string;
  appIv!: string;
  permissions!: object;
  timesExpire!: Date | null;
  extension!: object;
  status!: number;
  updatedAt!: Date;
  createdAt!: Date;
  deletedAt!: Date | null;

  static get tableName() {
    return `${process.env.DB_PREFIX || ''}secrets`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        title: { type: 'string' },
        appId: { type: 'string', maxLength: 40 },
        appSecret: { type: 'string', maxLength: 40 },
        appIv: { type: 'string', maxLength: 40 },
        permissions: { type: 'object' },
        timesExpire: { type: ['string', 'null'] },
        extension: { type: 'object' },
        status: { type: 'integer', minimum: 0, maximum: 1 },
        createdAt: { type: 'Date' },
        updatedAt: { type: 'Date' },
        deletedAt: { type: ['Date', 'null'] },
      }
    };
  }

  // 定义 JSON 字段（Objection 会自动序列化/反序列化）
  static get jsonAttributes() {
    return ['permissions', 'extension'];
  }

  // 👇 核心：通用查询构建器（返回 QueryBuilder）
  static buildQuery(
    qb: QueryBuilder<Secrets> = this.query(),
    filters: {
      id?: number;
      title?: string;
      appId?: number;
      status?: number;
    } = {},
    trashed: boolean = false
  ): QueryBuilder<Secrets> {
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

  // 查询单个任务
  static async findById(id: number) {
    return await this.query().findById(id);
  }

  // 单条查询（非 ID）
  static async findOne(filters: Parameters<typeof this.buildQuery>[1]) {
    const query = this.buildQuery(this.query(), filters);
    return await query.first(); // 或 .limit(1).first()
  }

  // 查询单个appId
  static async findAppId(appId: number) {
    const query = this.buildQuery(this.query(), { appId: appId });
    return await query.first(); // 或 .limit(1).first()
  }


  // 多条查询（分页）
  static async findMany(
    filters: Parameters<typeof this.buildQuery>[1],
    options: { page?: number; perPage?: number } = {}
  ) {
    const { page = 1, perPage = 10 } = options;
    const offset = (page - 1) * perPage;
    const baseQuery = this.buildQuery(this.query(),).orderBy('id', 'asc');
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

  // 更新（带条件）
  static async updateByFilters(
    filters: Parameters<typeof this.buildQuery>[1],
    data: Partial<Secrets>
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