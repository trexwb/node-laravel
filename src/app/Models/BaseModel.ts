import _ from 'lodash-es';
import { Model, snakeCaseMappers } from 'objection';
import dayjs from '@app/Helpers/Format';
import { container } from '@bootstrap/app';
import { CastInterface } from '@app/Casts/CastInterface';

export abstract class BaseModel extends Model {
  protected static table: string;
  protected static primaryKey: string = 'id';
  protected static fillable: string[] = [];
  protected static hidden: string[] = [];
  protected static casts: Record<string, CastInterface | string> = {};
  protected static useTimestamps: boolean = true;

  /**
   * 模拟 Laravel 的 create 方法
   */
  public static async create(data: any) {
    // 1. Fillable 白名单过滤
    let attributes = _.pick(data, this.fillable);

    // 2. 自动补充时间戳
    if (this.useTimestamps) {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
      attributes.created_at = now;
      attributes.updated_at = now;
    }

    // 3. 执行 Mutators (setXXXAttribute)
    attributes = this.runMutators(attributes);

    // 4. 执行 Casts (set)
    attributes = this.runCasts(attributes, 'set');

    const [id] = await container.db(this.table).insert(attributes);
    return this.find(id);
  }

  /**
   * 模拟 Laravel 的 find 方法
   */
  public static async find(id: any) {
    const row = await container.db(this.table).where(this.primaryKey, id).first();
    if (!row) return null;

    // 1. 执行 Casts (get)
    let data = this.runCasts(row, 'get');

    // 2. 执行 Accessors (getXXXAttribute)
    data = this.runAccessors(data);

    // 3. 隐藏敏感字段
    return _.omit(data, this.hidden);
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

  // 模拟 Laravel 的自动时间戳
  $beforeInsert() {
    const now = new Date().toISOString();
    (this as any).createdAt = now;
    (this as any).updatedAt = now;
  }

  $beforeUpdate() {
    (this as any).updatedAt = new Date().toISOString();
  }
}