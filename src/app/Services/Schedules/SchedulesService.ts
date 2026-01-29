import { CacheService } from '#app/Services/Cache/CacheService';
import { SchedulesModel } from '#app/Models/SchedulesModel';
import Utils from '#utils/index';

export class SchedulesService {
  protected static cacheKey: string = 'schedules';
  public static async findById(id: number) {
    return await CacheService.remember(`${this.cacheKey}[id:${id}]`, 0, async () => {
      return await SchedulesModel.findById(id);
    });
  }

  public static async findMany(
    filters: object | undefined = undefined,
    page: number = 1,
    pageSize: number = 10,
    sort: string | undefined = undefined,
    trashed: boolean = false
  ) {
    page = Utils.safeCastToInteger(page ?? 1);
    pageSize = Utils.safeCastToInteger(pageSize ?? 10);
    let order: { column: string; order: string }[] | undefined = undefined;
    const regex = /^([+-])(.*?)$/si;
    const match = (sort || '').match(regex);
    const schemaColumns = SchedulesModel.getSchemaDbColumns();
    if (match) {
      if (schemaColumns.includes(match[2])) order = [{ column: match[2], order: match[1] === '-' ? 'DESC' : 'ASC' }];
    }
    const cacheKey = `${this.cacheKey}[list:${JSON.stringify(Utils.sortMultiDimensionalObject([filters, page, pageSize, order]))}]`;
    return await CacheService.remember(`${cacheKey}`, 0, async () => {
      return await SchedulesModel.findMany(filters, { page, pageSize, order }, trashed);
    });
  }

  public static async findAll() {
    const cacheKey = `${this.cacheKey}[all:${JSON.stringify({ status: 1 })}]`;
    return await CacheService.remember(`${cacheKey}`, 0, async () => {
      return await SchedulesModel.findAll({ status: 1 }, undefined, false);
    });
  }

  public static async create(
    data: {
      title?: string;
      appId?: number;
      appSecret?: string;
      appIv?: string;
      permissions?: object;
      timesExpire?: Date | null;
      extension?: object;
      status?: number;
    } = {}
  ): Promise<InstanceType<typeof SchedulesModel> | null> {
    // 1. 创建用户
    const newUser = await SchedulesModel.insert(data);
    if (!newUser) {
      throw new Error('Failed to create secret');
    }
    // 2. 清除相关缓存（建议只清列表，或按需）
    await this.flushallCache(); // 或更精细地只清除列表缓存
    // 3. 返回新用户
    return newUser;
  }

  public static async updateById(
    id?: number,
    data: {
      title?: string;
      appId?: number;
      appSecret?: string;
      appIv?: string;
      permissions?: object;
      timesExpire?: Date | null;
      extension?: object;
      status?: number;
    } = {}
  ): Promise<InstanceType<typeof SchedulesModel> | null> {
    // 检查 id 是否存在
    if (id === undefined) {
      throw new Error('User ID is required for update operation');
    }
    // 更新用户
    const updatedUser = await SchedulesModel.updateById(id, data);
    if (!updatedUser) {
      throw new Error('Failed to update secret');
    }
    // 清除相关缓存
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return updatedUser as InstanceType<typeof SchedulesModel>;
  }

  public static async updateByFilters(
    filters: object | undefined = undefined,
    data: {
      title?: string;
      appId?: number;
      appSecret?: string;
      appIv?: string;
      permissions?: object;
      timesExpire?: Date | null;
      extension?: object;
      status?: number;
    } = {}
  ): Promise<number | null> {
    // 更新用户
    const processedData = { ...data } as Partial<InstanceType<typeof SchedulesModel>>;
    const affects = await SchedulesModel.updateByFilters(filters, processedData);
    // 清除相关缓存
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return affects;
  }

  public static async deleteById(id: number): Promise<number | null> {
    // 清除所有缓存
    const affects = await SchedulesModel.deleteById(id);
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return affects;
  }

  public static async deleteByFilters(filters: object | undefined = undefined): Promise<number | null> {
    // 清除所有缓存
    const affects = await SchedulesModel.deleteByFilters(filters);
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return affects;
  }

  public static async restoreByFilters(filters: object | undefined = undefined): Promise<number | null> {
    // 清除所有缓存
    const affects = await SchedulesModel.restoreByFilters(filters);
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return affects;
  }

  public static async clearUserCache(secret: SchedulesModel) {
    CacheService.forget(`${this.cacheKey}[id:${secret.id}]`);
  }

  public static async flushallCache() {
    await CacheService.forgetByPattern(`${this.cacheKey}[*]`);
    // await CacheService.flush();
  }
}