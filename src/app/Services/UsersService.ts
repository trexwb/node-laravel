import { CacheService } from '#app/Services/CacheService';
import { Users } from '#app/Models/Users';

export class UsersService {
  protected static cacheKey: string = 'users';
  public static async getId(userId: number) {
    return await CacheService.remember(`${this.cacheKey}:${userId}`, 0, async () => {
      return await Users.findById(userId);
    });
  }
}