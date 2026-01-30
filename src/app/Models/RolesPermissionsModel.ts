import { QueryBuilder } from 'objection';
import { config } from '#bootstrap/configLoader';
import { BaseModel } from '#app/Models/BaseModel';

export class RolesPermissionsModel extends BaseModel {
  // 显式声明属性，对应数据库字段
  permissionId!: number;
  roleId!: string;
  static softDelete = false;
  static useTimestamps = false;
  static inserTable = ['permissionId', 'roleId'];

  static get tableName() {
    return `${config('database.prefix')}roles_permissions`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['permissionId', 'roleId'], // 必填字段
      properties: {
        permissionId: { type: 'integer' },
        roleId: { type: 'integer' },
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
    query: QueryBuilder<RolesPermissionsModel> = this.query(),
    filters: {
      permissionId?: string | number | number[];
      roleId?: string | number | number[];
    } = {}
  ): QueryBuilder<RolesPermissionsModel> {
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
    if (filters.permissionId !== undefined && filters.permissionId !== null && filters.permissionId !== '') {
      applyCondition(`${table}.permission_id`, filters.permissionId);
    }
    if (filters.roleId !== undefined && filters.roleId !== null && filters.roleId !== '') {
      applyCondition(`${table}.role_id`, filters.roleId);
    }
    return query;
  }
}