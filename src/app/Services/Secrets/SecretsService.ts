import { CacheService } from '#app/Services/Cache/CacheService';
import { Secrets } from '#app/Models/Secrets';

export class SecretsService {
  protected static cacheKey: string = 'secrets';
  public static async getAppId(appId: number) {
    return await CacheService.remember(`${this.cacheKey}:${appId}`, 0, async () => {
      return await Secrets.findAppId(appId);
    });
  }
}