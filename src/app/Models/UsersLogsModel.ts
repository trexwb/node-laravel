import { QueryBuilder } from 'objection';
import { BaseModel } from '#app/Models/BaseModel';
import { UsersModel } from '#app/Models/UsersModel';
import { config } from '#bootstrap/configLoader';

export class UsersLogsModel extends BaseModel {
  // 显式声明属性，对应数据库字段
  id!: number;
  userId!: number;
  source!: object;
  handle!: object;
  updatedAt!: Date;
  createdAt!: Date;
  static softDelete = false;
  static inserTable = ['userId', 'source', 'handle'];

  static get tableName() {
    return `${config('database.prefix')}users_logs`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'handle'], // 必填字段
      properties: {
        id: { type: 'integer' },
        userId: { type: 'integer' },
        source: { type: 'object' },
        handle: { type: 'object' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      }
    };
  }

  // 定义 JSON 字段（Objection 会自动序列化/反序列化）
  static get jsonAttributes() {
    return ['source'];
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
    query: QueryBuilder<UsersLogsModel> = this.query(),
    filters: {
      id?: { not?: number | number[]; eq?: number | number[]; } | number | number[] | string[];
      userId?: string | number | number[];
      handle?: string;
      keywords?: string;
    } = {}
  ): QueryBuilder<UsersLogsModel> {
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
    // 处理 ID 过滤器 (支持 简单值, 数组, 或 {eq, not} 对象)
    if (filters.id !== undefined && filters.id !== null) {
      const id = filters.id;
      if (typeof id === 'object' && !Array.isArray(id)) {
        // 处理高级对象格式: { eq, not }
        if (id.eq !== undefined) applyCondition(`${table}.id`, id.eq);
        if (id.not !== undefined) applyCondition(`${table}.id`, id.not, true);
      } else {
        applyCondition(`${table}.id`, id);
      }
    }
    if (filters.keywords) {
      const keywords = filters.keywords.trim().split(/\s+/); // 按一个或多个空格拆分
      keywords.forEach(keyword => {
        query.where(function () {
          this.orWhereRaw(`LOCATE(?, \`${table}.source\`) > 0`, [keyword])
            .orWhereRaw(`LOCATE(?, \`${table}.handle\`) > 0`, [keyword])
            .orWhereIn(`${table}.user_id`, function () {
              this.select('id').from(UsersModel.tableName).where(function () {
                this.orWhereRaw('LOCATE(?, `nickname`) > 0', [keyword])
                  .orWhereRaw('LOCATE(?, `email`) > 0', [keyword])
                  .orWhereRaw('LOCATE(?, `mobile`) > 0', [keyword])
                  .orWhereRaw('LOCATE(?, `uuid`) > 0', [keyword])
              });
            })
        });
      });
    }
    if (filters.handle) {
      query.where(`${table}.handle`, filters.handle);
    }
    return query;
  }

  static get relationMappings() {
    return {
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: UsersModel,
        join: {
          from: `${this.tableName}}.user_id`,
          to: `${UsersModel.tableName}.id`
        }
      }
    };
  }

  // 查询单个日志并关联用户
  static async findByIdAndUser(id: number) {
    return await this.query().findById(id).withGraphJoined('user');
  }

  // 单条查询（非 ID）
  static async findOneAndUser(filters: Parameters<typeof this.buildQuery>[1]) {
    const query = this.buildQuery(this.query(), filters).withGraphJoined('user');
    return await query.first(); // 或 .limit(1).first()
  }

  // 多条查询（分页）
  static async findManyAndUser(
    filters: Parameters<typeof this.buildQuery>[1],
    options: {
      page?: number;
      pageSize?: number;
      order?: Array<{ column: string; order?: string }> | { column: string; order?: string } | undefined;
    } = {}
  ) {
    const { page = 1, pageSize = 10, order } = options;
    const offset = (page - 1) * pageSize;
    const baseQuery = this.buildQuery(this.query(), filters);
    const countQuery = baseQuery.clone();
    const dataQuery = baseQuery.clone();
    const total = await countQuery.resultSize();
    // 排序由 BaseModel 统一处理
    if (order) {
      (this as any).applyOrder(dataQuery, order);
    }
    const data = await dataQuery.withGraphJoined('user').limit(pageSize).offset(offset);
    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 访问器 (Accessor) 示例
  // Objection 直接使用 JS 的 get/set 语法
  get displayHandle() {
    return `Action: ${(this as any).handle}`;
  }
}