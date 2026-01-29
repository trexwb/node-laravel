import { QueryBuilder } from 'objection';
import { config } from '#bootstrap/configLoader';
import { BaseModel } from '#app/Models/BaseModel';

export type ConfigInsert = {
  key?: string;
  value?: object;
  updatedAt?: Date;
};

export class ConfigsModel extends BaseModel {
  static InsertType: ConfigInsert;
  // 显式声明属性，对应数据库字段
  id!: number;
  key!: string;
  value!: object;
  updatedAt!: Date;
  createdAt!: Date;
  deletedAt!: Date | null;
  static softDelete = true;

  static get tableName() {
    return `${config('database.prefix')}configs`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['key', 'value'], // 必填字段
      properties: {
        id: { type: 'integer' },
        key: { type: 'string' },
        value: { type: 'object' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        deletedAt: { type: ['string', 'null'] },
      }
    };
  }

  // 定义 JSON 字段（Objection 会自动序列化/反序列化）
  static get jsonAttributes() {
    return ['value'];
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
    query: QueryBuilder<ConfigsModel> = this.query(),
    filterss: {
      id?: { not?: number | number[]; eq?: number | number[]; } | number | number[] | string[];
      key?: string;
      keywords?: string;
    } = {}
  ): QueryBuilder<ConfigsModel> {
    if (!filterss) return query;
    if (filterss.id != null) {
      this.buildIdQuery(query, filterss.id);
    }
    if (filterss.keywords) {
      const keywords = filterss.keywords.trim().split(/\s+/); // 按一个或多个空格拆分
      keywords.forEach(keyword => {
        query.where(function () {
          this.orWhereRaw('LOCATE(?, `key`) > 0', [keyword])
            .orWhereRaw('LOCATE(?, `value`) > 0', [keyword])
        });
      });
    }
    if (filterss.key) {
      query.where('key', filterss.key);
    }
    return query;
  }

  static async findByKey(key: string) {
    const query = this.buildQuery(this.query(), { key });
    return await query.first(); // 或 .limit(1).first()
  }
}