import { QueryBuilder } from 'objection';
import { BaseModel } from '#app/Models/BaseModel';
import { config } from '#bootstrap/configLoader';
import { nowInTz, tzToUtc, formatDate } from '#app/Helpers/Format';

export class JobsModel extends BaseModel {
  // 显式声明属性，对应数据库字段
  id!: number;
  queue!: string;
  payload!: object;
  attempts!: number;
  reservedAt!: Date | null;
  availableAt!: Date;
  finishedAt!: Date | null;
  updatedAt!: Date;
  createdAt!: Date;
  static softDelete = false;

  static get tableName() {
    return `${config('database.prefix')}jobs`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['queue', 'payload'], // 必填字段
      properties: {
        id: { type: 'integer' },
        queue: { type: 'string' },
        payload: { type: 'object' },
        attempts: { type: 'integer' },
        reservedAt: { type: ['string', 'null'] },
        availableAt: { type: 'string' },
        finishedAt: { type: ['string', 'null'] },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      }
    };
  }

  // 定义 JSON 字段（Objection 会自动序列化/反序列化）
  static get jsonAttributes() {
    return ['payload'];
  }

  static getSchemaColumns(): string[] {
    return Object.keys(this.jsonSchema?.properties ?? {});
  }

  static getSchemaDbColumns() {
    const props = Object.keys(this.jsonSchema?.properties ?? {});
    const mapper = this.columnNameMappers;
    if (!mapper?.format) {
      return props;
    }
    return props.map((prop) => {
      const mapped = mapper.format({ [prop]: null });
      return Object.keys(mapped)[0];
    });
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
    query: QueryBuilder<JobsModel> = this.query(),
    filterss: {
      id?: number;
      name?: string;
      status?: string; // 假设有 status 字段
      availableAtFrom?: Date;
      availableAtTo?: Date;
      reserved?: boolean; // true=已预留, false=未预留
      finished?: boolean;
    } = {}
  ): QueryBuilder<JobsModel> {
    function applyWhereCondition(field: string, value: any) {
      if (Array.isArray(value)) {
        if (value.length > 0) query.whereIn(field, value);
      } else if (value) {
        query.where(field, value);
      }
    }
    if (filterss.id != null) {
      applyWhereCondition('id', filterss.id);
    }
    if (filterss.reserved === true) {
      query = query.whereNotNull('reserved_at');
    } else if (filterss.reserved === false) {
      query = query.whereNull('reserved_at');
    }
    if (filterss.finished === true) {
      query = query.whereNotNull('finished_at');
    } else if (filterss.finished === false) {
      query = query.whereNull('finished_at');
    }
    return query;
  }

  // 创建任务
  static async createJob(payload: Record<string, any>, availableAt?: Date | string): Promise<JobsModel> {
    return await this.query().insert({
      queue: payload.queue || 'default', // 修正：使用 queue 而不是 name
      payload: JSON.parse(JSON.stringify(payload || {})), // 修正：payload 应该是字符串类型
      attempts: 0,
      availableAt: tzToUtc(availableAt),
    }).returning('*').first(); // 添加 returning 以获取插入的记录
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