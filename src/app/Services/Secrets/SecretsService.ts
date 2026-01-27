import { CacheService } from '#app/Services/Cache/CacheService';
import { SecretsModel } from '#app/Models/SecretsModel';

export class SecretsService {
  protected static cacheKey: string = 'secrets';
  public static async getAppId(appId: number) {
    return await CacheService.remember(`${this.cacheKey}[getAppId]:${appId}`, 0, async () => {
      return await SecretsModel.findAppId(appId);
    });
  }
}