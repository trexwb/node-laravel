import { Model, snakeCaseMappers, QueryBuilder } from 'objection';
import type { Pojo } from 'objection';
import { nowInTz, formatDate } from '#app/Helpers/Format';
import type { CastInterface } from '#app/Casts/CastInterface';
import * as _ from 'lodash-es';

// 定义ID过滤条件的类型
type IdFilter = {
  not?: number | number[];
  eq?: number | number[];
} | number | number[] | string[];

export class BaseModel extends Model {
  protected static table: string;
  protected static primaryKey: string = 'id';
  protected static fillable: string[] = [];
  protected static hidden: string[] = [];
  protected static casts: Record<string, CastInterface | string> = {};
  protected static useTimestamps: boolean = true;

  static buildIdQuery(
    qb: QueryBuilder<BaseModel> = this.query(),
    ids?: IdFilter
  ): QueryBuilder<BaseModel> {
    let query = qb;
    function applyWhereCondition(field: string, value: any) {
      if (Array.isArray(value)) {
        if (value.length > 0) query.whereIn(field, value);
      } else if (value) {
        query.where(field, value);
      }
    }
    if (ids != null) {
      // 检查是否为对象形式的过滤条件
      if (typeof ids === 'object' && ids !== null) {
        if ('not' in ids && ids.not !== undefined) {
          Array.isArray(ids.not)
            ? query.whereNotIn('id', ids.not as number[])
            : query.whereNot('id', ids.not as number);
        }
        if ('eq' in ids && ids.eq !== undefined) {
          Array.isArray(ids.eq)
            ? query.whereIn('id', ids.eq as number[])
            : query.where('id', ids.eq as number);
        }
      } else {
        applyWhereCondition('id', ids);
      }
    }
    return query;
  }

  $parseDatabaseJson(json: Pojo): Pojo {
    json = super.$parseDatabaseJson(json);
    for (const key of Object.keys(json)) {
      const value = json[key];
      // 这里的逻辑可以根据你的字段命名习惯优化，比如只处理以 At 结尾的字段
      if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
        // 将时间转为指定时区并格式化
        json[key] = formatDate(value);
      }
    }
    return json;
  }

  $formatJson(json: Pojo): Pojo {
    json = super.$formatJson(json);
    // 遍历所有字段，如果是 Date 对象或符合日期格式的字符串，进行转换
    for (const key of Object.keys(json)) {
      const value = json[key];
      // 这里的逻辑可以根据你的字段命名习惯优化，比如只处理以 At 结尾的字段
      if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
        // 将时间转为指定时区并格式化
        json[key] = formatDate(value);
      }
    }
    return json;
  }

  /**
   * 自动运行访问器 (Getters)
   */
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

  /**
   * 自动运行修改器 (Setters)
   */
  protected static runMutators(data: any) {
    for (const key in data) {
      const methodName = `set${_.upperFirst(_.camelCase(key))}Attribute`;
      if (typeof (this as any)[methodName] === 'function') {
        data[key] = (this as any)[methodName](data[key]);
      }
    }
    return data;
  }

  /**
   * 执行类型转换
   */
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

  // 启用自动时间戳（createdAt, updatedAt）
  static get createdAtColumn() {
    return 'createdAt';
  }

  static get updatedAtColumn() {
    return 'updatedAt';
  }

  getUpdatedAtAttribute(value: string | Date) {
    return formatDate(value);
  }

  getCreatedAtAttribute(value: string | Date) {
    return formatDate(value);
  }

  // 自动时间戳
  $beforeInsert() {
    // const now = new Date().toISOString();
    const now = nowInTz();
    (this as any).createdAt = now;
    (this as any).updatedAt = now;
  }

  // 自动更新 updatedAt（Objection 默认已支持，这里显式保留）
  $beforeUpdate() {
    // (this as any).updatedAt = new Date().toISOString();
    (this as any).updatedAt = nowInTz();
  }

  // 查询单个任务
  static async findById(id: number) {
    return await this.query().findById(id);
  }

  static async create(
    data: Partial<any>
  ) {
    // 1. 应用修改器和 casts（set）
    let normalized = { ...data };
    normalized = this.runMutators(normalized);
    normalized = this.runCasts(normalized, 'set');

    // 2. 插入数据库（Objection 会自动调用  $ beforeInsert）
    const inserted = await this.query().insert(normalized) as Partial<any>;

    // 3. 转为 plain object 并应用访问器和 casts（get）
    let json = inserted.toJSON();
    json = this.runAccessors(json);
    json = this.runCasts(json, 'get');

    // 4. 重新构造为模型实例（保留原型链）
    return Object.assign(Object.create(this.prototype), json);
  }

  static async createMany(
    data: Array<Partial<Partial<any>>>
  ): Promise<Partial<any>[]> {
    if (data.length === 0) {
      return [];
    }
    // 1. 对每条数据应用修改器（setters）和 casts（set）
    const processedData = data.map(item => {
      let normalized = { ...item };
      // 应用修改器（如 setEmailAttribute）
      normalized = this.runMutators(normalized);
      // 应用类型转换（如 cast: 'encrypted'）
      normalized = this.runCasts(normalized, 'set');
      // 如果启用时间戳，且未提供 createdAt/updatedAt，则由 $beforeInsert 处理
      // （Objection 会在 insert 时调用 $beforeInsert，所以这里不用手动设）
      return normalized;
    });

    // 2. 使用 Objection 的 insert 批量插入（会触发 $beforeInsert）
    const inserted: Partial<any>[] = await this.query().insert(processedData) as unknown as Partial<any>[];
    // const inserted = await this.query().insert(processedData);

    // 3. 对返回结果应用访问器（getters）和 casts（get）
    // 注意：inserted 是模型实例数组，需转为 plain object 再处理
    const result = inserted.map((instance: Partial<any>) => {
      let json = instance.toJSON(); // 转为 plain object（已 snake_case -> camelCase）
      // 应用访问器（如 getCreatedAtAttribute）
      json = this.runAccessors(json);
      // 应用类型转换（get）
      json = this.runCasts(json, 'get');
      // 重新构造为模型实例（保留方法和关系）
      return Object.assign(Object.create(this.prototype), json);
    });

    return result;
  }

  // 更新任务
  static async updateById(id: number, data: Partial<any>) {
    return await this.query().patchAndFetchById(id, data);
  }

  // 删除任务（硬删除）
  static async deleteById(id: number) {
    return await this.query().deleteById(id);
  }
}