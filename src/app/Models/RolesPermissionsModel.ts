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
    filterss: {
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
    if (!filterss) return query;
    if (Object.hasOwn(filterss, 'permissionId') && filterss.permissionId != '' && filterss.permissionId != null) {
      applyWhereCondition('user_id', filterss.permissionId);
    }
    if (Object.hasOwn(filterss, 'roleId') && filterss.roleId != '' && filterss.roleId != null) {
      applyWhereCondition('role_id', filterss.roleId);
    }
    return query;
  }
}