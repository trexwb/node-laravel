import { QueryBuilder } from 'objection';
import { config } from '#bootstrap/configLoader';
import { BaseModel } from '#app/Models/BaseModel';

export type SecretInsert = {
  title?: string;
  appId?: number;
  appSecret?: string;
  appIv?: string;
  permissions?: object;
  timesExpire?: Date | null;
  extension?: object;
  status?: number;
};

export class SecretsModel extends BaseModel {
  static InsertType: SecretInsert;
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
  static softDelete = true;

  static get tableName() {
    return `${config('database.prefix')}secrets`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['title', 'appId'], // 必填字段
      properties: {
        id: { type: 'integer' },
        title: { type: 'string' },
        appId: { type: 'string', maxLength: 40 },
        appSecret: { type: 'string', maxLength: 40 },
        appIv: { type: 'string', maxLength: 40 },
        permissions: { type: 'object' },
        timesExpire: { type: ['string', 'null'] },
        extension: { type: 'object' },
        status: { type: 'integer', minimum: 0, maximum: 1 },
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
    query: QueryBuilder<SecretsModel> = this.query(),
    filterss: {
      id?: number;
      title?: string;
      appId?: number;
      status?: string | number | number[];
      keywords?: string;
    } = {},
    trashed: boolean = false
  ): QueryBuilder<SecretsModel> {
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
      applyWhereCondition(`${this.tableName}.status`, filterss.status);
    }
    if (filterss.keywords) {
      const keywords = filterss.keywords.trim().split(/\s+/); // 按一个或多个空格拆分
      keywords.forEach(keyword => {
        query.where(function () {
          this.orWhereRaw('LOCATE(?, `title`) > 0', [keyword])
            .orWhereRaw('LOCATE(?, `app_id`) > 0', [keyword])
            .orWhereRaw('LOCATE(?, `permissions`) > 0', [keyword])
            .orWhereRaw('LOCATE(?, `extension`) > 0', [keyword])
        });
      });
    }
    if (filterss.title) {
      query.where('title', filterss.title);
    }
    if (trashed) {
      query.whereNotNull('deleted_at');
    } else {
      query.whereNull('deleted_at');
    }
    return query;
  }

  // 查询单个appId
  static async findByAppId(appId: number) {
    const query = this.buildQuery(this.query(), { appId });
    return await query.first(); // 或 .limit(1).first()
  }
}