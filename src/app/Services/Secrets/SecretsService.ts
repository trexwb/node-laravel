import { CacheService } from '#app/Services/Cache/CacheService';
import { SecretsModel } from '#app/Models/SecretsModel';
import Utils from '#utils/index';

export class SecretsService {
  protected static cacheKey: string = 'secrets';
  public static async findById(appId: number) {
    return await CacheService.remember(`${this.cacheKey}[appId:${appId}]`, 0, async () => {
      return await SecretsModel.findById(appId);
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
    const cacheKey = `${this.cacheKey}[list:${JSON.stringify(Utils.sortMultiDimensionalObject([filters, page, pageSize, order]))}]`;
    return await CacheService.remember(`${cacheKey}`, 0, async () => {
      return await SecretsModel.findMany(filters, { page, pageSize, order }, trashed);
    });
  }

  public static async clearUserCache(secret: SecretsModel) {
    CacheService.forget(`${this.cacheKey}[id:${secret.id}]`);
  }

  public static async flushallCache() {
    await CacheService.forgetByPattern(`${this.cacheKey}[*]`);
    // await CacheService.flush();
  }
}