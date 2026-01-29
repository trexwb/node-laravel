import { QueryBuilder } from 'objection';
import { config } from '#bootstrap/configLoader';
import { BaseModel } from '#app/Models/BaseModel';
import { PermissionsModel } from '#app/Models/PermissionsModel';
import { RolesPermissionsModel } from '#app/Models/RolesPermissionsModel';

export class RolesModel extends BaseModel {
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
    return `${config('database.prefix')}roles`;
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
    query: QueryBuilder<RolesModel> = this.query(),
    filters: {
      id?: { not?: number | number[]; eq?: number | number[]; } | number | number[] | string[];
      name?: string;
      status?: string | number | number[];
      keywords?: string;
    } = {},
    trashed: boolean = false
  ): QueryBuilder<RolesModel> {
    function applyWhereCondition(field: string, value: any) {
      if (Array.isArray(value)) {
        if (value.length > 0) query.whereIn(field, value);
      } else if (value) {
        query.where(field, value);
      }
    }
    if (!filters) return query;
    if (filters.id != null) {
      this.buildIdQuery(query, filters.id);
    }
    if (Object.hasOwn(filters, 'status') && filters.status != '' && filters.status != null) {
      applyWhereCondition(`${this.tableName}.status`, filters.status);
    }
    if (filters.keywords) {
      const keywords = filters.keywords.trim().split(/\s+/); // 按一个或多个空格拆分
      keywords.forEach(keyword => {
        const myTableName = this.tableName;
        query.where(function () {
          this.orWhereRaw(`LOCATE(?, \`${myTableName}.name\`) > 0`, [keyword])
            .orWhereRaw(`LOCATE(?, \`${myTableName}.permissions\`) > 0`, [keyword])
            .orWhereRaw(`LOCATE(?, \`${myTableName}.extension\`) > 0`, [keyword])
        });
      });
    }
    if (filters.name) {
      query.where(`${this.tableName}.name`, filters.name);
    }
    if (trashed) {
      query.whereNotNull(`${this.tableName}.deleted_at`);
    } else {
      query.whereNull(`${this.tableName}.deleted_at`);
    }
    return query;
  }

  static get relationMappings() {
    return {
      permissions: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: PermissionsModel, // ✅ 目标模型
        join: {
          from: `${this.tableName}.id`, // roles.id
          through: {
            from: `${RolesPermissionsModel.tableName}.role_id`, // roles_permissions.role_id
            to: `${RolesPermissionsModel.tableName}.permission_id` // roles_permissions.permission_id
          },
          to: `${PermissionsModel.tableName}.id` // ✅ permissions.id
        }
      }
    };
  }
}