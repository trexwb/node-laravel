import { CacheService } from '#app/Services/Cache/CacheService';
import { UsersModel } from '#app/Models/UsersModel';
import Utils from '#utils/index';

export class UsersService {
  protected static cacheKey: string = 'users';
  public static async findById(userId: number) {
    return await CacheService.remember(`${this.cacheKey}[id:${userId}]`, 0, async () => {
      return await UsersModel.findByIdAndRoles(userId);
    });
  }

  public static async getUuid(uuid: string) {
    return await CacheService.remember(`${this.cacheKey}[uuid:${uuid}]`, 0, async () => {
      return await UsersModel.findOneAndRoles({ uuid: uuid });
    });
  }

  public static async getToken(token: string) {
    return await CacheService.remember(`${this.cacheKey}[token:${token}]`, 0, async () => {
      return await UsersModel.findOneAndRoles({ rememberToken: token });
    });
  }

  public static async getAccount(account: string | number) {
    return await CacheService.remember(`${this.cacheKey}[account:${account}]`, 0, async () => {
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
      return await UsersModel.findOneAndRoles(filters);
    });
  }

  public static async updateToken(user: InstanceType<typeof UsersModel>) {
    const newToken = Utils.generateRandomString(64);
    UsersModel.updateById(user.id, { rememberToken: newToken });
    this.clearUserCache(user);
    return newToken;
  }

  public static async findMany(
    filter: object | undefined = undefined,
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
    const schemaColumns = UsersModel.getSchemaDbColumns();
    if (match) {
      if (schemaColumns.includes(match[2])) order = [{ column: match[2], order: match[1] === '-' ? 'DESC' : 'ASC' }];
    }
    const cacheKey = `${this.cacheKey}[list:${JSON.stringify(Utils.sortMultiDimensionalObject([filter, page, pageSize, order]))}]`;
    return await CacheService.remember(`${cacheKey}`, 0, async () => {
      return await UsersModel.findManyAndRoles(filter, { page, pageSize, order }, trashed);
    });
  }

  public static async clearUserCache(user: UsersModel) {
    CacheService.forget(`${this.cacheKey}[id:${user.id}]`);
    CacheService.forget(`${this.cacheKey}[uuid:${user.uuid}]`);
    CacheService.forget(`${this.cacheKey}[token:${user.rememberToken}]`);
    CacheService.forget(`${this.cacheKey}[account:${user.nickname}]`);
    CacheService.forget(`${this.cacheKey}[account:${user.email}]`);
    CacheService.forget(`${this.cacheKey}[account:${user.mobile}]`);
  }

  public static async flushallCache() {
    await CacheService.forgetByPattern(`${this.cacheKey}[*]`);
    // await CacheService.flush();
  }
}