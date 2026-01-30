import { QueryBuilder } from 'objection';
import { config } from '#bootstrap/configLoader';
import { BaseModel } from '#app/Models/BaseModel';

export class PermissionsModel extends BaseModel {
  // 显式声明属性，对应数据库字段
  id!: number;
  name!: string;
  permissions!: object;
  extension!: object;
  status!: number;
  updatedAt!: Date;
  createdAt!: Date;
  deletedAt!: Date | null;
  static softDelete = true;
  static inserTable = ['name', 'permissions', 'extension', 'status'];

  static get tableName() {
    return `${config('database.prefix')}permissions`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'permissions'], // 必填字段
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        permissions: { type: 'object' },
        extension: { type: 'object' },
        status: { type: 'integer' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        deletedAt: { type: ['string', 'null'] },
      }
    };
  }

  // 定义 JSON 字段（Objection 会自动序列化/反序列化）
  static get jsonAttributes() {
    return ['permissions', 'extension'];
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

  // 👇 核心：通用查询构建器（返回 QueryBuilder）
  static buildQuery(
    query: QueryBuilder<PermissionsModel> = this.query(),
    filters: {
      id?: { not?: number | number[]; eq?: number | number[]; } | number | number[] | string[];
      name?: string;
      status?: string | number | number[];
      keywords?: string;
    } = {},
    trashed: boolean = false
  ): QueryBuilder<PermissionsModel> {
    function applyCondition(field: string, value: any, isNot: boolean = false) {
      const isArray = Array.isArray(value);
      if (isNot) {
        isArray ? query.whereNotIn(field, value) : query.whereNot(field, value);
      } else {
        isArray ? query.whereIn(field, value) : query.where(field, value);
      }
    }
    if (!filters) return query;
    const table = this.tableName;
    // 处理 ID 过滤器 (支持 简单值, 数组, 或 {eq, not} 对象)
    if (filters.id !== undefined && filters.id !== null) {
      const id = filters.id;
      if (typeof id === 'object' && !Array.isArray(id)) {
        // 处理高级对象格式: { eq, not }
        if (id.eq !== undefined) applyCondition(`${table}.id`, id.eq);
        if (id.not !== undefined) applyCondition(`${table}.id`, id.not, true);
      } else {
        applyCondition(`${table}.id`, id);
      }
    }
    if (filters.status !== undefined && filters.status !== null && filters.status !== '') {
      applyCondition(`${table}.status`, filters.status);
    }
    if (filters.keywords) {
      const keywords = filters.keywords.trim().split(/\s+/); // 按一个或多个空格拆分
      keywords.forEach(keyword => {
        query.where(function () {
          this.orWhereRaw(`LOCATE(?, \`${table}.name\`) > 0`, [keyword])
            .orWhereRaw(`LOCATE(?, \`${table}.permissions\`) > 0`, [keyword])
            .orWhereRaw(`LOCATE(?, \`${table}.extension\`) > 0`, [keyword])
        });
      });
    }
    if (filters.name) {
      query.where(`${table}.name`, filters.name);
    }
    if (trashed) {
      query.whereNotNull(`${table}.deleted_at`);
    } else {
      query.whereNull(`${table}.deleted_at`);
    }
    return query;
  }
}