import { CacheService } from '#app/Services/Cache/CacheService';
import { RolesModel } from '#app/Models/RolesModel';
import { UsersModel } from '#app/Models/UsersModel';
import { UsersRolesModel } from '#app/Models/UsersRolesModel';
import Utils from '#utils/index';
import { Crypto } from '#utils/Crypto';

export class UsersService {
  protected static cacheKey: string = 'users';
  public static async findById(userId: number) {
    return await CacheService.remember(`${this.cacheKey}[id:${userId}]`, 0, async () => {
      return await UsersModel.findByIdAndRoles(userId);
    });
  }

  public static async findByUuid(uuid: string) {
    return await CacheService.remember(`${this.cacheKey}[uuid:${uuid}]`, 0, async () => {
      return await UsersModel.findOneAndRoles({ uuid: uuid });
    });
  }

  public static async findByToken(token: string) {
    return await CacheService.remember(`${this.cacheKey}[token:${token}]`, 0, async () => {
      return await UsersModel.findOneAndRoles({ rememberToken: token });
    });
  }

  public static async findByAccount(account: string | number) {
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
    const schemaColumns = UsersModel.getSchemaDbColumns();
    if (match) {
      if (schemaColumns.includes(match[2])) order = [{ column: match[2], order: match[1] === '-' ? 'DESC' : 'ASC' }];
    }
    const cacheKey = `${this.cacheKey}[list:${JSON.stringify(Utils.sortMultiDimensionalObject([filters, page, pageSize, order, trashed]))}]`;
    return await CacheService.remember(`${cacheKey}`, 0, async () => {
      return await UsersModel.findManyAndRoles(filters, { page, pageSize, order }, trashed);
    });
  }

  public static async create(
    data: {
      nickname?: string;
      email?: string;
      mobile?: string;
      avatar?: string;
      password?: string;
      salt?: string;
      uuid?: string;
      secret?: string;
      extension?: object;
      status?: number;
      roles?: number[] | number;
    } = {}
  ): Promise<InstanceType<typeof UsersModel> | null> {
    if (!data.uuid) data.uuid = Utils.getUUID();
    if (!data.secret) data.secret = Utils.generateRandomString(32);
    if (!data.salt) data.salt = Utils.generateRandomString(6);
    if (!data.password) data.password = Crypto.md5(Utils.generateRandomString(16));
    data.password = Crypto.md5(`${data.password}${data.salt}`);

    let rolesIds: number[] = [];
    if (data.roles) {
      rolesIds = (await RolesModel.findAll({ id: data.roles, status: 1 })).map(row => row.id);
      if (!rolesIds.length) {
        throw new Error(`Failed to create user: invalid role id(s) ${data.roles}`);
      }
    }

    const newUser = await UsersModel.insert(data);
    if (!newUser) {
      throw new Error('Failed to create user');
    }

    if (rolesIds.length) {
      // await UsersRolesModel.deleteByFilters({ userId: newUser.id });
      const roleData = rolesIds.map(roleId => ({ roleId, userId: newUser.id, status: 1 }));
      await UsersRolesModel.insertMany(roleData);
    }
    // 2. 清除相关缓存（建议只清列表，或按需）
    await this.flushallCache(); // 或更精细地只清除列表缓存
    // 3. 返回新用户
    return newUser;
  }

  public static async updateById(
    id?: number,
    data: {
      nickname?: string;
      email?: string;
      mobile?: string;
      avatar?: string;
      password?: string;
      salt?: string;
      extension?: object;
      status?: number;
    } = {}
  ): Promise<InstanceType<typeof UsersModel> | null> {
    if (data.password) {
      data.salt = Utils.generateRandomString(6);
      data.password = Crypto.md5(`${data.password}${data.salt}`);
    }
    // 检查 id 是否存在
    if (id === undefined) {
      throw new Error('User ID is required for update operation');
    }
    // 更新用户
    const updatedUser = await UsersModel.updateById(id, data);
    if (!updatedUser) {
      throw new Error('Failed to update user');
    }
    // 清除相关缓存
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return updatedUser as InstanceType<typeof UsersModel>;
  }

  public static async updateByFilters(
    filters: object | undefined = undefined,
    data: {
      nickname?: string;
      email?: string;
      mobile?: string;
      avatar?: string;
      password?: string;
      salt?: string;
      uuid?: string;
      extension?: object;
      status?: number;
    } = {}
  ): Promise<number | null> {
    // 更新用户
    const processedData = { ...data } as Partial<InstanceType<typeof UsersModel>>;
    const affects = await UsersModel.updateByFilters(filters, processedData);
    // 清除相关缓存
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return affects;
  }

  public static async deleteById(id: number): Promise<number | null> {
    // 清除所有缓存
    const affects = await UsersModel.deleteById(id);
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return affects;
  }

  public static async deleteByFilters(filters: object | undefined = undefined): Promise<number | null> {
    // 清除所有缓存
    const affects = await UsersModel.deleteByFilters(filters);
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return affects;
  }


  public static async restoreById(id: number): Promise<number | null> {
    // 清除所有缓存
    const affects = await UsersModel.restoreById(id);
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return affects;
  }

  public static async restoreByFilters(filters: object | undefined = undefined): Promise<number | null> {
    // 清除所有缓存
    const affects = await UsersModel.restoreByFilters(filters);
    await this.flushallCache();
    // 类型断言确保返回正确类型
    return affects;
  }

  public static async forceDelete(filters: object | undefined = undefined): Promise<number | null> {
    // 清除所有缓存
    return await UsersModel.forceDelete(filters);
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