/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-01 14:48:58
 * @FilePath: /node-laravel/src/app/Models/SchedulesLogsModel.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import { QueryBuilder } from 'objection';
import { BaseModel } from '#app/Models/BaseModel';
import { SchedulesModel } from '#app/Models/SchedulesModel';
import { config } from '#bootstrap/configLoader';

export class SchedulesLogsModel extends BaseModel {
  // 显式声明属性，对应数据库字段
  id!: number;
  scheduleId!: number;
  source!: object;
  handle!: object;
  updatedAt!: Date;
  createdAt!: Date;
  static softDelete = false;
  static inserTable = ['scheduleId', 'source', 'handle'];

  static get tableName() {
    return `${config('database.prefix')}schedules_logs`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['scheduleId', 'handle'], // 必填字段
      properties: {
        id: { type: 'integer' },
        scheduleId: { type: 'integer' },
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
    query: QueryBuilder<SchedulesLogsModel> = this.query(),
    filters: {
      id?: { not?: number | number[]; eq?: number | number[]; } | number | number[] | string[];
      scheduleId?: string | number | number[];
      title?: string;
      keywords?: string;
    } = {}
  ): QueryBuilder<SchedulesLogsModel> {
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
        const myTableName = this.tableName;
        query.where(function () {
          this.orWhereRaw(`LOCATE(?, \`${myTableName}\`.\`source\`) > 0`, [keyword])
            .orWhereRaw(`LOCATE(?, \`${myTableName}\`.\`handle\`) > 0`, [keyword])
            .orWhereIn(`${myTableName}.schedule_id`, function () {
              this.select('id').from(SchedulesModel.tableName).where(function () {
                this.orWhereRaw('LOCATE(?, `title`) > 0', [keyword])
                  .orWhereRaw('LOCATE(?, `app_id`) > 0', [keyword])
                  .orWhereRaw('LOCATE(?, `extension`) > 0', [keyword])
              });
            })
        });
      });
    }
    if (filters.title) {
      query.where(`${this.tableName}.title`, filters.title);
    }
    return query;
  }

  static get relationMappings() {
    return {
      schedule: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: SchedulesModel,
        join: {
          from: `${this.tableName}}.schedule_id`,
          to: `${SchedulesModel.tableName}.id`
        }
      }
    };
  }

  // 查询单个日志及密钥
  static async findByIdAndSchedule(id: number) {
    return await this.query().findById(id).withGraphJoined('schedule');
  }

  // 单条查询（非 ID）
  static async findOneAndSchedule(filters: Parameters<typeof this.buildQuery>[1]) {
    const query = this.buildQuery(this.query(), filters).withGraphJoined('schedule');
    return await query.first(); // 或 .limit(1).first()
  }

  // 多条查询（分页）
  static async findManyAndSchedule(
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
    const data = await dataQuery.withGraphJoined('schedule').limit(pageSize).offset(offset);
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