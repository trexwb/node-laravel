import { QueryBuilder } from 'objection';
import { config } from '#bootstrap/configLoader';
import { BaseModel } from '#app/Models/BaseModel';

export class SchedulesModel extends BaseModel {
  // 显式声明属性，对应数据库字段
  id!: number;
  name!: string;
  time!: string;
  handler!: object;
  status!: number;
  updatedAt!: Date;
  createdAt!: Date;
  deletedAt!: Date | null;
  static softDelete = true;
  static inserTable = ['name', 'time', 'time', 'handler', 'tistatusme'];

  static get tableName() {
    return `${config('database.prefix')}schedules`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'time', 'handler'], // 必填字段
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        time: { type: 'string' },
        handler: { type: 'object' },
        status: { type: 'integer', minimum: 0, maximum: 1 },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        deletedAt: { type: ['string', 'null'] },
      }
    };
  }

  // 定义 JSON 字段（Objection 会自动序列化/反序列化）
  static get jsonAttributes() {
    return ['handler'];
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
    query: QueryBuilder<SchedulesModel> = this.query(),
    filterss: {
      id?: { not?: number | number[]; eq?: number | number[]; } | number | number[] | string[];
      name?: string;
      status?: string | number | number[];
      keywords?: string;
    } = {}
  ): QueryBuilder<SchedulesModel> {
    if (!filterss) return query;
    function applyWhereCondition(field: string, value: any) {
      if (Array.isArray(value)) {
        if (value.length > 0) query.whereIn(field, value);
      } else if (value) {
        query.where(field, value);
      }
    }
    if (!filterss) return query;
    if (filterss.id != null) {
      this.buildIdQuery(query, filterss.id);
    }
    if (Object.hasOwn(filterss, 'status') && filterss.status != '' && filterss.status != null) {
      applyWhereCondition('status', filterss.status);
    }
    if (filterss.keywords) {
      const keywords = filterss.keywords.trim().split(/\s+/); // 按一个或多个空格拆分
      keywords.forEach(keyword => {
        query.where(function () {
          this.orWhereRaw('LOCATE(?, `name`) > 0', [keyword])
            .orWhereRaw('LOCATE(?, `handler`) > 0', [keyword])
        });
      });
    }
    if (filterss.name) {
      query.where('name', filterss.name);
    }
    return query;
  }
}