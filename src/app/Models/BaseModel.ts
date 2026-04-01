/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: ${git_name}
 * @LastEditTime: 2026-04-01 14:41:07
 * @FilePath: /stl-dev-server/server/src/app/Models/BaseModel.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import { Model, snakeCaseMappers, QueryBuilder, raw } from 'objection';
import type { Pojo } from 'objection';
import { nowInTz, formatDate } from '#app/Helpers/Format';
import type { CastInterface } from '#app/Casts/CastInterface';
import { config } from '#bootstrap/configLoader';
import * as _ from 'lodash-es';

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

  $parseDatabaseJson(json: Pojo): Pojo {
    // DB -> JS：这里不做“展示层”的格式化，避免把原始时间字段变成字符串导致比较/更新异常。
    return super.$parseDatabaseJson(json);
  }

  $formatJson(json: Pojo): Pojo {
    json = super.$formatJson(json);
    // 仅对常见时间字段做展示格式化，避免误伤类似 "2026-03-xx" 的非时间业务字符串。
    const shouldFormatDateField = (key: string) => {
      const TIMESTAMP_FIELDS = new Set([
        'availableAt',
        'cancelledAt',
        'closedAt',
        'completedAt',
        'createdAt',
        'deletedAt',
        'expiresAt',
        'finishedAt',
        'invalidatedAt',
        'notifiedAt',
        'paidAt',
        'pricedAt',
        'refundedAt',
        'reservedAt',
        'returnShippedAt',
        'reviewedAt',
        'startsAt',
        'updatedAt',
        'usedAt',
      ]);
      if (TIMESTAMP_FIELDS.has(key)) return true;
      return key.endsWith('At') || key.endsWith('Date');
    };
    for (const key of Object.keys(json)) {
      if (!shouldFormatDateField(key)) continue;
      const value = json[key];
      if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
        json[key] = formatDate(value);
      }
    }
    return json;
  }

  getUpdatedAtAttribute(value: string | Date) {
    return formatDate(value);
  }

  getCreatedAtAttribute(value: string | Date) {
    return formatDate(value);
  }

  // 自动时间戳
  $beforeInsert() {
    if ((this.constructor as typeof BaseModel).useTimestamps) {
      // const now = new Date().toISOString();
      const now = nowInTz();
      (this as any).createdAt = now;
      (this as any).updatedAt = now;
    }
  }

  // 自动更新 updatedAt（Objection 默认已支持，这里显式保留）
  $beforeUpdate() {
    if ((this.constructor as typeof BaseModel).useTimestamps) {
      // (this as any).updatedAt = new Date().toISOString();
      (this as any).updatedAt = nowInTz();
    }
  }

  // 子类必须实现
  static buildQuery(
    query: QueryBuilder<BaseModel> = this.query(),
    _filters: any,
    _trashed: boolean = false
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
          // 模拟 Laravel 传递当前值进行转换
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

  // 自动处理驼峰命名转下划线 (数据库用 snake_case, 代码用 camelCase)
  static get columnNameMappers() {
    return snakeCaseMappers();
  }

  // 启用自动时间戳（createdAt）
  static get createdAtColumn() {
    return 'createdAt';
  }

  // 启用自动时间戳（updatedAt）
  static get updatedAtColumn() {
    return 'updatedAt';
  }

  // 排序任务
  static applyOrder<T extends BaseModel>(
    query: QueryBuilder<T>,
    order?: Array<{ column: string; order?: string }> | { column: string; order?: string }
  ): QueryBuilder<T> {
    let safeOrder: any[] = [];
    // 1. 格式化 order 参数
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
    // 2. 检查当前模型是否存在 'sort' 字段 (通过 jsonSchema 判断)
    const hasSortField = this.jsonSchema && this.jsonSchema.properties && Object.keys(this.jsonSchema.properties).includes('sort');
    if (hasSortField) {
      // 存在 sort 字段时，插入权重排序：sort > 0 的排在前面，且按值升序
      safeOrder.unshift(
        { column: raw('CASE WHEN `sort` > 0 THEN 1 ELSE 0 END'), order: 'DESC' },
        { column: 'sort', order: 'ASC' }
      );
    }
    // 3. 应用排序
    if (safeOrder.length > 0) {
      query.orderBy(safeOrder);
    } else {
      // 默认排序
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
    // 排序由 BaseModel 统一处理
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
    // 1. 应用修改器和 casts（set）
    let normalized = this.inserTable.length ? Object.fromEntries(Object.entries(data).filter(([key]) => this.inserTable.includes(key))) : { ...data };
    normalized = this.runMutators(normalized);
    normalized = this.runCasts(normalized, 'set');
    // 2. 插入数据库（Objection 会自动调用  $ beforeInsert）
    const inserted = await this.query().insertAndFetch(normalized) as Partial<any>;
    // 3. 转为 plain object 并应用访问器和 casts（get）
    let json = inserted.toJSON();
    json = this.runAccessors(json);
    json = this.runCasts(json, 'get');
    // 4. 重新构造为模型实例（保留原型链）
    return Object.assign(Object.create(this.prototype), json);
  }

  // 批量插入
  static async insertMany<T extends typeof BaseModel>(
    this: T,
    data: Array<Record<string, any>>
  ) {
    if (data.length === 0) return [];
    const inserted: Array<InstanceType<T>> = [];
    // 可以使用事务提高性能
    await this.transaction(async trx => {
      for (const item of data) {
        // 1️⃣ 复制数据
        let normalized = this.inserTable.length ? Object.fromEntries(Object.entries(item).filter(([key]) => this.inserTable.includes(key))) : { ...item };
        // 2️⃣ 应用修改器（set）
        normalized = this.runMutators(normalized);
        // 3️⃣ 应用类型转换（set）
        normalized = this.runCasts(normalized, 'set');
        // 4️⃣ 单条插入 + 获取完整模型
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
    if (this.softDelete) { // 软删除
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
    if (this.softDelete) { // 软删除
      return await query.patch({
        [this.softDeleteColumn]: null,
      });
    }
    return null;
  }

  // 通过ID删除
  static async deleteById(id: number) {
    if (this.softDelete) { // 软删除
      return await this.query()
        .where('id', id)
        .patch({ [this.softDeleteColumn]: nowInTz() });
    }
    return await this.query().deleteById(id);
  }

  // 通过过滤条件删除
  static async deleteByFilters<T extends typeof BaseModel>(
    this: T,
    filters: Parameters<T['buildQuery']>[1]
  ) {
    const query = this.buildQuery(this.query(), filters);
    if (this.softDelete) { // 软删除
      return await query.patch({
        [this.softDeleteColumn]: nowInTz(),
      });
    }
    return await query.delete();
  }

  static async forceDelete<T extends typeof BaseModel>(
    this: T,
    filters: Parameters<T['buildQuery']>[1]
  ) {
    // 安全检查：只有启用软删除的表才需要验证 deleted_at
    if ((this as any).softDelete === true) {
      // 只查询已软删除的记录（deleted_at 不为 null）
      const query = this.buildQuery(this.query(), filters, true);
      const count = await query.resultSize();
      if (count === 0) {
        const err = new Error(
          `No soft-deleted record found matching the given filters — ` +
          `force delete requires the record to be soft-deleted first. ` +
          `Table: ${(this as any).tableName}`
        );
        (err as any).code = 'BaseModel:forceDelete:notSoftDeleted';
        throw err;
      }
      return await query.delete();
    }
    // 非软删除表（如日志表），直接删除
    const query = this.buildQuery(this.query(), filters);
    return await query.delete();
  }
}
