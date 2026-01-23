import { QueryBuilder } from 'objection';
import { BaseModel } from '#app/Models/Base';
import { nowInTz, tzToUtc, formatDate } from '#app/Helpers/Format';

export class Jobs extends BaseModel {
  // 显式声明属性，对应数据库字段
  id!: number;
  queue!: string;
  payload!: string;
  attempts!: number;
  reservedAt!: Date | null;
  availableAt!: Date;
  finishedAt!: Date | null;
  updatedAt!: Date;
  createdAt!: Date;

  static get tableName() {
    return `${process.env.DB_PREFIX || ''}jobs`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        queue: { type: 'string' },
        payload: { type: 'object' },
        attempts: { type: 'integer' },
        // 其他字段可选加
      }
    };
  }

  // 定义 JSON 字段（Objection 会自动序列化/反序列化）
  static get jsonAttributes() {
    return ['payload'];
  }

  getReservedAtAttribute(value: string | Date) {
    return formatDate(value);
  }

  getAvailableAtAttribute(value: string | Date) {
    return formatDate(value);
  }

  getFinishedAtAttribute(value: string | Date) {
    return formatDate(value);
  }

  // 👇 核心：通用查询构建器（返回 QueryBuilder）
  static buildQuery(
    qb: QueryBuilder<Jobs> = this.query(),
    filters: {
      id?: number;
      name?: string;
      status?: string; // 假设有 status 字段
      availableAtFrom?: Date;
      availableAtTo?: Date;
      reserved?: boolean; // true=已预留, false=未预留
      finished?: boolean;
    } = {}
  ): QueryBuilder<Jobs> {
    let query = qb;
    if (filters.id != null) {
      query = query.where('id', filters.id);
    }
    if (filters.reserved === true) {
      query = query.whereNotNull('reserved_at');
    } else if (filters.reserved === false) {
      query = query.whereNull('reserved_at');
    }
    if (filters.finished === true) {
      query = query.whereNotNull('finished_at');
    } else if (filters.finished === false) {
      query = query.whereNull('finished_at');
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
  static async createJob(payload: Record<string, any>, availableAt?: Date | string): Promise<Jobs> {
    return await this.query().insert({
      queue: payload.queue || 'default', // 修正：使用 queue 而不是 name
      payload: JSON.parse(JSON.stringify(payload || {})), // 修正：payload 应该是字符串类型
      attempts: 0,
      availableAt: tzToUtc(availableAt),
    }).returning('*').first(); // 添加 returning 以获取插入的记录
  }

  // 更新（带条件）
  static async updateByFilters(
    filters: Parameters<typeof this.buildQuery>[1],
    data: Partial<Jobs>
  ) {
    const query = this.buildQuery(this.query(), filters);
    return await query.patch(data); // 返回受影响行数
  }

  // 删除（带条件）
  static async deleteByFilters(filters: Parameters<typeof this.buildQuery>[1]) {
    const query = this.buildQuery(this.query(), filters);
    return await query.delete(); // 返回受影响行数
  }

  // 辅助方法：获取下一条待处理任务
  static async getNextAvailable() {
    const job = await this.query()
      .select()
      .where('available_at', '<=', nowInTz())
      .whereNull('reserved_at')
      .whereNull('finished_at')
      .orderBy('id', 'asc')
      //   .toKnexQuery()
      //   .toSQL().sql,
      .first()
      .forUpdate()
      .skipLocked();

    if (!job) return null;
    // 立即标记为已预留
    // await job.$query().patch({ reservedAt: nowInTz() });
    return job;
  }
}