import { QueryBuilder } from 'objection';
import { config } from '#bootstrap/configLoader';
import { BaseModel } from '#app/Models/BaseModel';

export class UsersModel extends BaseModel {
  // 显式声明属性，对应数据库字段
  id!: number;
  nickname!: string;
  email!: string;
  mobile!: string;
  avatar!: string;
  password!: string;
  salt!: string;
  rememberToken!: string;
  uuid!: string;
  secret!: string;
  extension!: object;
  status!: number;
  updatedAt!: Date;
  createdAt!: Date;
  deletedAt!: Date | null;
  static softDelete = true;

  static get tableName() {
    return `${config('database.prefix')}users`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['nickname', 'email', 'mobile'], // 必填字段
      properties: {
        nickname: { type: 'string' },
        email: { type: 'string' },
        mobile: { type: 'string' },
        avatar: { type: 'string' },
        password: { type: 'string' },
        salt: { type: 'string' },
        rememberToken: { type: 'string' },
        uuid: { type: 'string' },
        secret: { type: 'string' },
        extension: { type: 'object' },
        // isActive: { type: 'boolean' },
        status: { type: 'integer' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      }
    };
  }

  // 定义 JSON 字段（Objection 会自动序列化/反序列化）
  static get jsonAttributes() {
    return ['extension'];
  }

  // 👇 核心：通用查询构建器（返回 QueryBuilder）
  static buildQuery(
    query: QueryBuilder<UsersModel> = this.query(),
    filters: {
      id?: { not?: number | number[]; eq?: number | number[]; } | number | number[] | string[];
      nickname?: string;
      mobile?: string;
      email?: string;
      emmobileail?: string;
      rememberToken?: string;
      uuid?: string;
      status?: string | number | number[];
      keywords?: string;
      roleId?: number | number[];
    } = {},
    trashed: boolean = false
  ): QueryBuilder<UsersModel> {
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
      applyWhereCondition('status', filters.status);
    }
    if (filters.uuid) {
      applyWhereCondition('uuid', filters.uuid);
    }
    if (filters.keywords) {
      const keywords = filters.keywords.trim().split(/\s+/); // 按一个或多个空格拆分
      keywords.forEach(keyword => {
        query.where(function () {
          this.orWhereRaw('LOCATE(?, `nickname`) > 0', [keyword])
            .orWhereRaw('LOCATE(?, `truename`) > 0', [keyword])
            .orWhereRaw('LOCATE(?, `email`) > 0', [keyword])
            .orWhereRaw('LOCATE(?, `mobile`) > 0', [keyword])
            .orWhereRaw('LOCATE(?, `uuid`) > 0', [keyword])
            .orWhereRaw('LOCATE(?, `extension`) > 0', [keyword])
        });
      });
    }
    if (filters.email) {
      query.where('email', filters.email);
    }
    if (filters.mobile) {
      query.where('mobile', filters.mobile);
    }
    if (filters.nickname) {
      query.where('nickname', filters.nickname);
    }
    if (filters.rememberToken) {
      query.where('remember_token', filters.rememberToken);
    }
    function isValidCategoryId(variable: any) {
      // 检查是否为数组且非空
      if (Array.isArray(variable) && variable.length > 0) {
        return true;
      }
      // 检查是否为数字且大于 0
      if (typeof variable === 'number' && variable > 0) {
        return true;
      }
      // 如果不是上述两种情况之一，则返回 false
      return false;
    }
    // 按角色搜索用户
    if (isValidCategoryId(filters.roleId)) {
      // query.whereIn('id', function () {
      //   if (Array.isArray(filters.roleId)) {
      //     if (filters.roleId.length > 0) this.select('user_id').from(usersRolesModel.$table).whereIn('roleId', where.roleId);
      //   } else {
      //     this.select('user_id').from(usersRolesModel.$table).where('roleId', where.roleId);
      //   }
      // });
      // 效率低下时请更换成whereExists
      // query.whereExists(function () {
      //   if (Array.isArray(where.roleId)) {
      //     if (where.roleId.length > 0) {
      //       this.select('user_id')
      //         .from(usersRolesModel.$table)
      //         .whereRaw(`${usersRolesModel.$table}.user_id = ${query.$table}.id`)
      //         .whereIn('roleId', where.roleId)
      //     }
      //   } else {
      //     this.select('user_id')
      //       .from(usersRolesModel.$table)
      //       .whereRaw(`${usersRolesModel.$table}.user_id = ${query.$table}.id`)
      //       .where('roleId', where.roleId)
      //   }
      // })
    }
    if (trashed) {
      query.whereNotNull('deleted_at');
    } else {
      query.whereNull('deleted_at');
    }
    return query;
  }
}