import { QueryBuilder } from 'objection';
import { config } from '#bootstrap/configLoader';
import { BaseModel } from '#app/Models/BaseModel';

export class UsersRolesModel extends BaseModel {
  // 显式声明属性，对应数据库字段
  userId!: number;
  roleId!: number;
  status!: number;
  static softDelete = false;
  static useTimestamps = false;
  static inserTable = ['userId', 'roleId', 'status'];

  static get tableName() {
    return `${config('database.prefix')}users_roles`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'roleId'], // 必填字段
      properties: {
        userId: { type: 'integer' },
        roleId: { type: 'integer' },
        status: { type: 'integer', minimum: 0, maximum: 1 },
      }
    };
  }

  // 定义 JSON 字段（Objection 会自动序列化/反序列化）
  static get jsonAttributes() {
    return [];
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
    query: QueryBuilder<UsersRolesModel> = this.query(),
    filters: {
      userId?: string | number | number[];
      roleId?: string | number | number[];
      status?: string | number | number[];
    } = {}
  ): QueryBuilder<UsersRolesModel> {
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
    if (filters.status !== undefined && filters.status !== null && filters.status !== '') {
      applyCondition(`${table}.status`, filters.status);
    }
    if (Object.hasOwn(filters, 'userId') && filters.userId != '' && filters.userId != null) {
      applyCondition(`${table}.user_id`, filters.userId);
    }
    if (Object.hasOwn(filters, 'roleId') && filters.roleId != '' && filters.roleId != null) {
      applyCondition(`${table}.role_id`, filters.roleId);
    }
    return query;
  }
}