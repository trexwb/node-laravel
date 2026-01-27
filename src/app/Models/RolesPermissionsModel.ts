import { QueryBuilder } from 'objection';
import { config } from '#bootstrap/configLoader';
import { BaseModel } from '#app/Models/BaseModel';

export class RolesPermissionsModel extends BaseModel {
  // 显式声明属性，对应数据库字段
  permissionId!: number;
  roleId!: string;
  static softDelete = false;

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

  // 👇 核心：通用查询构建器（返回 QueryBuilder）
  static buildQuery(
    query: QueryBuilder<RolesPermissionsModel> = this.query(),
    filters: {
      permissionId?: string | number | number[];
      roleId?: string | number | number[];
    } = {}
  ): QueryBuilder<RolesPermissionsModel> {
    function applyWhereCondition(field: string, value: any) {
      if (Array.isArray(value)) {
        if (value.length > 0) query.whereIn(field, value);
      } else if (value) {
        query.where(field, value);
      }
    }
    if (!filters) return query;
    if (Object.hasOwn(filters, 'permissionId') && filters.permissionId != '' && filters.permissionId != null) {
      applyWhereCondition('user_id', filters.permissionId);
    }
    if (Object.hasOwn(filters, 'roleId') && filters.roleId != '' && filters.roleId != null) {
      applyWhereCondition('role_id', filters.roleId);
    }
    return query;
  }
}