import { QueryBuilder } from 'objection';
import { config } from '#bootstrap/configLoader';
import { BaseModel } from '#app/Models/BaseModel';

export class UsersRolesModel extends BaseModel {
  // 显式声明属性，对应数据库字段
  userId!: number;
  roleId!: string;
  status!: number;
  static softDelete = false;

  static get tableName() {
    return `${config('database.prefix')}users_roles`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
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

  // 👇 核心：通用查询构建器（返回 QueryBuilder）
  static buildQuery(
    query: QueryBuilder<UsersRolesModel> = this.query(),
    filters: {
      userId?: string | number | number[];
      roleId?: string | number | number[];
      status?: string | number | number[];
    } = {}
  ): QueryBuilder<UsersRolesModel> {
    function applyWhereCondition(field: string, value: any) {
      if (Array.isArray(value)) {
        if (value.length > 0) query.whereIn(field, value);
      } else if (value) {
        query.where(field, value);
      }
    }
    if (!filters) return query;
    if (Object.hasOwn(filters, 'status') && filters.status != '' && filters.status != null) {
      applyWhereCondition('status', filters.status);
    }
    if (Object.hasOwn(filters, 'userId') && filters.userId != '' && filters.userId != null) {
      applyWhereCondition('user_id', filters.userId);
    }
    if (Object.hasOwn(filters, 'roleId') && filters.roleId != '' && filters.roleId != null) {
      applyWhereCondition('role_id', filters.roleId);
    }
    return query;
  }
}