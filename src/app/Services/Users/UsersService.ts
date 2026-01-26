import { CacheService } from '#app/Services/Cache/CacheService';
import { UsersModel } from '#app/Models/UsersModel';
import Utils from '#utils/index';

export class UsersService {
  protected static cacheKey: string = 'users';
  public static async getId(userId: number) {
    return await CacheService.remember(`[${this.cacheKey}]getId:${userId}`, 0, async () => {
      return await UsersModel.findById(userId);
    });
  }
  public static async getUuid(uuid: string) {
    return await CacheService.remember(`[${this.cacheKey}]getUuid:${uuid}`, 0, async () => {
      return await UsersModel.findOne({ uuid: uuid });
    });
  }
  public static async getToken(token: string) {
    return await CacheService.remember(`[${this.cacheKey}]getToken:${token}`, 0, async () => {
      return await UsersModel.findOne({ rememberToken: token });
    });
  }
  public static async getAccount(account: string | number) {
    return CacheService.remember(`[${this.cacheKey}]getAccount:${account}`, 0, async () => {
      function isValidEmail(email: string) {
        const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regex.test(String(email).toLowerCase());
      }
      function isValidPhoneNumber(phoneNumber: string) {
        const pattern = /^1[3456789]\d{9}$/;
        return pattern.test(phoneNumber);
      }
      const filters: Record<string, any> = {};
      if (isValidEmail(account.toString())) {
        filters.email = account;
      } else if (isValidPhoneNumber(account.toString())) {
        filters.mobile = account;
      } else {
        filters.nickname = account;
      }
      return await UsersModel.findOne(filters);
    });
  }
  public static async updateToken(user: InstanceType<typeof UsersModel>) {
    const newToken = Utils.generateRandomString(64);
    UsersModel.updateById(user.id, { rememberToken: newToken });
    this.clearUserCache(user);
    return newToken;
  }
  public static async clearUserCache(user: UsersModel) {
    CacheService.forget(`[${this.cacheKey}]getId:${user.id}`);
    CacheService.forget(`[${this.cacheKey}]getAccount:${user.nickname}`);
    CacheService.forget(`[${this.cacheKey}]getAccount:${user.email}`);
    CacheService.forget(`[${this.cacheKey}]getAccount:${user.mobile}`);
    CacheService.forget(`[${this.cacheKey}]getToken:${user.rememberToken}`);
    CacheService.forget(`[${this.cacheKey}]getUuid:${user.uuid}`);
  }
}