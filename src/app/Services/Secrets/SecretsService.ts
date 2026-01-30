import { CacheService } from '#app/Services/Cache/CacheService';
import { SecretsModel } from '#app/Models/SecretsModel';
import Utils from '#utils/index';

export class SecretsService {
  protected static cacheKey: string = 'secrets';
  public static async findById(id: number) {
    return await CacheService.remember(`${this.cacheKey}[id:${id}]`, 0, async () => {
      return await SecretsModel.findById(id);
    });
  }

  public static async findByAppId(appId: number) {
    return await CacheService.remember(`${this.cacheKey}[appId:${appId}]`, 0, async () => {
      return await SecretsModel.findByAppId(appId);
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
    const schemaColumns = SecretsModel.getSchemaDbColumns();
    if (match) {
      if (schemaColumns.includes(match[2])) order = [{ column: match[2], order: match[1] === '-' ? 'DESC' : 'ASC' }];
    }
    const cacheKey = `${this.cacheKey}[list:${JSON.stringify(Utils.sortMultiDimensionalObject([filters, page, pageSize, order, trashed]))}]`;
    return await CacheService.remember(`${cacheKey}`, 0, async () => {
      return await SecretsModel.findMany(filters, { page, pageSize, order }, trashed);
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
  ): Promise<InstanceType<typeof SecretsModel> | null> {
    // 1. 创建用户
    const newUser = await SecretsModel.insert(data);
    if (!newUser) {
      throw new Error('Failed to create secret');
    }
    // 2. 清除相关缓存（建议只清列表，或按需）
    await this.flushallCache(); // 或更精细地只清除列表缓存
    // 3. 返回新用户
    return newUser;
  }

  public static async modifyById(
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
  ): Promise<InstanceType<typeof SecretsModel> | null> {
    // 检查 id 是否存在
    if (id === undefined) {
      throw new Error('User ID is required for modify operation');
    }
    // 更新用户
    const modifydUser = await SecretsModel.modifyById(id, data);
    if (!modifydUser) {
      throw new Error('Failed to modify secret');
    }
    // 清除相关缓存
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return modifydUser as InstanceType<typeof SecretsModel>;
  }

  public static async modifyByFilters(
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
    const processedData = { ...data } as Partial<InstanceType<typeof SecretsModel>>;
    const affects = await SecretsModel.modifyByFilters(filters, processedData);
    // 清除相关缓存
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return affects;
  }

  public static async deleteById(id: number): Promise<number | null> {
    // 清除所有缓存
    const affects = await SecretsModel.deleteById(id);
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return affects;
  }

  public static async deleteByFilters(filters: object | undefined = undefined): Promise<number | null> {
    // 清除所有缓存
    const affects = await SecretsModel.deleteByFilters(filters);
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return affects;
  }


  public static async restoreById(id: number): Promise<number | null> {
    // 清除所有缓存
    const affects = await SecretsModel.restoreById(id);
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return affects;
  }

  public static async restoreByFilters(filters: object | undefined = undefined): Promise<number | null> {
    // 清除所有缓存
    const affects = await SecretsModel.restoreByFilters(filters);
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return affects;
  }

  public static async forceDelete(filters: object | undefined = undefined): Promise<number | null> {
    // 清除所有缓存
    return await SecretsModel.forceDelete(filters);
  }

  public static async clearUserCache(secret: SecretsModel) {
    CacheService.forget(`${this.cacheKey}[id:${secret.id}]`);
    CacheService.forget(`${this.cacheKey}[appId:${secret.appId}]`);
  }

  public static async flushallCache() {
    await CacheService.forgetByPattern(`${this.cacheKey}[*]`);
    // await CacheService.flush();
  }
}