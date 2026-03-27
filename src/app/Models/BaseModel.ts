/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/app/Models/BaseModel.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import { Model, snakeCaseMappers, QueryBuilder, raw } from 'objection';
import type { Pojo } from 'objection';
import { nowInTz, formatDate } from '#app/Helpers/Format';
import type { CastInterface } from '#app/Casts/CastInterface';
import * as _ from 'lodash-es';
import { config } from '#bootstrap/configLoader';

export class BaseModel extends Model {
  protected static table: string;
  protected static primaryKey: string = 'id';
  protected static fillable: string[] = [];
  protected static hidden: string[] = [];
  protected static casts: Record<string, CastInterface | string> = {};
  protected static useTimestamps: boolean = true;
  // 👇 子类声明允许 insert 的字段
  static inserTable: readonly string[] = [];
  // 👇 是否支持软删除（默认 false）
  static softDelete = false;
  // 👇 软删除字段名（可覆盖）
  static softDeleteColumn = 'deleted_at';
  // 👇 需要自动格式化日期的字段名模式（优化：只在匹配这些模式时才做日期转换）
  protected static dateFields: string[] = ['At', 'Time', 'Date'];

  // ============================================================
  // 日期转换 — 优化：仅对以 At/Time/Date 结尾的字段做格式转换
  // ============================================================
  private isDateField(key: string): boolean {
    return this.dateFields.some(suffix => key.endsWith(suffix));
  }

  $parseDatabaseJson(json: Pojo): Pojo {
    json = super.$parseDatabaseJson(json);
    for (const key of Object.keys(json)) {
      const value = json[key];
      if (!this.isDateField(key)) continue;
      if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
        json[key] = formatDate(value);
      }
    }
    return json;
  }

  $formatJson(json: Pojo): Pojo {
    json = super.$formatJson(json);
    for (const key of Object.keys(json)) {
      const value = json[key];
      if (!this.isDateField(key)) continue;
      if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
        json[key] = formatDate(value);
      }
    }
    return json;
  }

  // 自动时间戳
  $beforeInsert() {
    if ((this.constructor as typeof BaseModel).useTimestamps) {
      const now = nowInTz();
      (this as any).createdAt = now;
      (this as any).updatedAt = now;
    }
  }

  // 自动更新 updatedAt
  $beforeUpdate() {
    if ((this.constructor as typeof BaseModel).useTimestamps) {
      (this as any).updatedAt = nowInTz();
    }
  }

  // 子类必须实现
  static buildQuery(
    query: QueryBuilder<BaseModel> = this.query(),
    filters: any,
    trashed: boolean = false
  ): QueryBuilder<any> {
    // 🔧 Debug 模式下才打印 SQL，避免生产环境污染日志
    if (config('app.debugger') === true) {
      console.debug('[SQL]', query.toKnexQuery().toSQL().toNative());
    }
    return query;
  }

  // 自动运行访问器 (Getters)
  protected static runAccessors(data: any) {
    const proto = this.prototype;
    const methods = Object.getOwnPropertyNames(this).concat(Object.getOwnPropertyNames(proto));
    methods.forEach(method => {
      if (method.startsWith('get') && method.endsWith('Attribute')) {
        const field = _.snakeCase(method.replace('get', '').replace('Attribute', ''));
        if (data[field] !== undefined) {
          data[field] = (this as any)[method](data[field]);
        }
      }
    });
    return data;
  }

  // 自动运行修改器 (Setters)
  protected static runMutators(data: any) {
    for (const key in data) {
      const methodName = `set${_.upperFirst(_.camelCase(key))}Attribute`;
      if (typeof (this as any)[methodName] === 'function') {
        data[key] = (this as any)[methodName](data[key]);
      }
    }
    return data;
  }

  // 执行类型转换
  protected static runCasts(data: any, type: 'get' | 'set') {
    const result = { ...data };
    for (const key in this.casts) {
      const caster = this.casts[key];
      if (result[key] !== undefined && typeof caster !== 'string') {
        result[key] = type === 'get' ? caster.get(result[key]) : caster.set(result[key]);
      }
    }
    return result;
  }

  // 驼峰 → 下划线 映射
  static get columnNameMappers() {
    return snakeCaseMappers();
  }

  static get createdAtColumn() {
    return 'createdAt';
  }

  static get updatedAtColumn() {
    return 'updatedAt';
  }

  // 排序任务
  static applyOrder<T extends BaseModel>(
    query: QueryBuilder<T>,
    order?: Array<{ column: string; order?: string }> | { column: string; order?: string }
  ): QueryBuilder<T> {
    let safeOrder: any[] = [];
    if (Array.isArray(order)) {
      safeOrder = order.map(item => ({
        column: item.column,
        order: item.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
      }));
    } else if (order && typeof order === 'object') {
      safeOrder = [{
        column: order.column,
        order: (order as any).order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
      }];
    }
    const hasSortField = this.jsonSchema && this.jsonSchema.properties && Object.keys(this.jsonSchema.properties).includes('sort');
    if (hasSortField) {
      safeOrder.unshift(
        { column: raw('CASE WHEN `sort` > 0 THEN 1 ELSE 0 END'), order: 'DESC' },
        { column: 'sort', order: 'ASC' }
      );
    }
    if (safeOrder.length > 0) {
      query.orderBy(safeOrder);
    } else {
      query.orderBy('id', 'asc');
    }
    return query;
  }

  // 根据id取数据
  static async findById(id: number) {
    return await this.query().findById(id);
  }

  // 查询单条
  static async findOne<T extends typeof BaseModel>(
    this: T,
    filters: Parameters<T['buildQuery']>[1],
    trashed: boolean = false
  ): Promise<InstanceType<T> | undefined> {
    const query = this.buildQuery(this.query(), filters, trashed);
    return await query.first();
  }

  // 多条查询（全部）
  static async findAll<T extends typeof BaseModel>(
    this: T,
    filters: Parameters<typeof this.buildQuery>[1],
    options: {
      order?: Array<{ column: string; order?: string }> | { column: string; order?: string };
    } = {},
    trashed: boolean = false
  ) {
    const { order } = options;
    const baseQuery = this.buildQuery(this.query(), filters, trashed);
    if (order) {
      (this as any).applyOrder(baseQuery, order);
    }
    return await baseQuery;
  }

  // 查询多条（分页）
  static async findMany<T extends typeof BaseModel>(
    this: T,
    filters: Parameters<T['buildQuery']>[1],
    options: {
      page?: number;
      pageSize?: number;
      order?: Array<{ column: string; order?: string }> | { column: string; order?: string } | undefined;
    } = {},
    trashed: boolean = false
  ) {
    const { page = 1, pageSize = 10, order } = options;
    const offset = (page - 1) * pageSize;
    const baseQuery = this.buildQuery(this.query(), filters, trashed);
    const countQuery = baseQuery.clone();
    const dataQuery = baseQuery.clone();
    const total = await countQuery.resultSize();
    if (order) {
      (this as any).applyOrder(dataQuery, order);
    }
    const data = await dataQuery.limit(pageSize).offset(offset);
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

  // 单条插入
  static async insert<T extends typeof BaseModel>(
    this: T,
    data: Record<string, any>
  ) {
    let normalized = this.inserTable.length
      ? Object.fromEntries(Object.entries(data).filter(([key]) => this.inserTable.includes(key)))
      : { ...data };
    normalized = this.runMutators(normalized);
    normalized = this.runCasts(normalized, 'set');
    const inserted = await this.query().insertAndFetch(normalized) as Partial<any>;
    let json = inserted.toJSON();
    json = this.runAccessors(json);
    json = this.runCasts(json, 'get');
    return Object.assign(Object.create(this.prototype), json);
  }

  // 批量插入
  static async insertMany<T extends typeof BaseModel>(
    this: T,
    data: Array<Record<string, any>>
  ) {
    if (data.length === 0) return [];
    const inserted: Array<InstanceType<T>> = [];
    await this.transaction(async trx => {
      for (const item of data) {
        let normalized = this.inserTable.length
          ? Object.fromEntries(Object.entries(item).filter(([key]) => this.inserTable.includes(key)))
          : { ...item };
        normalized = this.runMutators(normalized);
        normalized = this.runCasts(normalized, 'set');
        const result = await this.query(trx).insert(normalized);
        inserted.push(result as InstanceType<T>);
      }
    });
    return inserted;
  }

  // 通过ID更新
  static async modifyById(id: number, data: Partial<any>) {
    return await this.query().patchAndFetchById(id, data);
  }

  // 通过过滤条件更新
  static async modifyByFilters<T extends typeof BaseModel>(
    this: T,
    filters: Parameters<T['buildQuery']>[1],
    data: Partial<InstanceType<T>>
  ) {
    const query = this.buildQuery(this.query(), filters);
    return await query.patch(data);
  }

  // 通过ID恢复
  static async restoreById(id: number) {
    if (this.softDelete) {
      return await this.query()
        .where('id', id)
        .patch({ [this.softDeleteColumn]: null });
    }
    return null;
  }

  // 通过过滤条件恢复
  static async restoreByFilters<T extends typeof BaseModel>(
    this: T,
    filters: Parameters<T['buildQuery']>[1]
  ) {
    const query = this.buildQuery(this.query(), filters);
    if (this.softDelete) {
      return await query.patch({ [this.softDeleteColumn]: null });
    }
    return null;
  }

  // 通过ID删除
  static async deleteById(id: number) {
    if (this.softDelete) {
      return await this.query()
        .where('id', id)
        .patch({ [this.softDeleteColumn]: nowInTz() });
    }
    return await this.query().deleteById(id);
  }

  // 通过过滤条件删除
  static async deleteByFilters<T extends typeof BaseModel>(
    filters: Parameters<T['buildQuery']>[1]
  ) {
    const query = this.buildQuery(this.query(), filters);
    if (this.softDelete) {
      return await query.patch({ [this.softDeleteColumn]: nowInTz() });
    }
    return await query.delete();
  }

  static async forceDelete<T extends typeof BaseModel>(
    filters: Parameters<T['buildQuery']>[1]
  ) {
    const query = this.buildQuery(this.query(), filters);
    return await query.delete();
  }
}
