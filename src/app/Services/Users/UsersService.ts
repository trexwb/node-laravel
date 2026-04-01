/*
 * @Author: trexwb
 * @Date: 2026-02-05 10:40:12
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-01 14:23:26
 * @FilePath: /node-laravel/src/app/Services/Users/UsersService.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import { CacheService } from '#app/Services/Cache/CacheService';
import { RolesModel } from '#app/Models/RolesModel';
import { UsersModel } from '#app/Models/UsersModel';
import { UsersRolesModel } from '#app/Models/UsersRolesModel';
import Utils from '#utils/index';
import { Crypto } from '#utils/Crypto';
import { isValidEmail, isValidPhoneNumber } from '#utils/Validator';
import { logger } from '#utils/Logger';

export class UsersService {
  protected static cacheKey: string = 'users';

  // ============================================================
  // 查询方法（带缓存）
  // ============================================================
  public static async findById(userId: number) {
    return await CacheService.remember(`${this.cacheKey}[id:${userId}]`, 0, async () => {
      return await UsersModel.findByIdAndRoles(userId);
    });
  }

  public static async findByUuid(uuid: string) {
    return await CacheService.remember(`${this.cacheKey}[uuid:${uuid}]`, 0, async () => {
      return await UsersModel.findOneAndRoles({ uuid });
    });
  }

  public static async findByToken(token: string) {
    return await CacheService.remember(`${this.cacheKey}[token:${token}]`, 0, async () => {
      return await UsersModel.findOneAndRoles({ rememberToken: token });
    });
  }

  public static async findByAccount(account: string | number) {
    const filters: Record<string, string> = {};
    if (isValidEmail(account.toString())) {
      filters.email = account.toString();
    } else if (isValidPhoneNumber(account.toString())) {
      filters.mobile = account.toString();
    } else {
      filters.nickname = account.toString();
    }
    return await CacheService.remember(`${this.cacheKey}[account:${account}]`, 0, async () => {
      return await UsersModel.findOneAndRoles(filters);
    });
  }

  public static async updateToken(user: InstanceType<typeof UsersModel>) {
    const newToken = Utils.generateRandomString(64);
    await UsersModel.modifyById(user.id, { rememberToken: newToken });
    await this.clearUserCache(user);
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
    const match = (sort || '').match(/^([+-])(.*?)$/si);
    const schemaColumns = UsersModel.getSchemaDbColumns();
    if (match && schemaColumns.includes(match[2])) {
      order = [{ column: match[2], order: match[1] === '-' ? 'DESC' : 'ASC' }];
    }
    const cacheKey = `${this.cacheKey}[list:${JSON.stringify(Utils.sortMultiDimensionalObject([filters, page, pageSize, order, trashed]))}]`;
    return await CacheService.remember(cacheKey, 0, async () => {
      return await UsersModel.findManyAndRoles(filters, { page, pageSize, order }, trashed);
    });
  }

  // ============================================================
  // 写操作（清除相关缓存）
  // ============================================================
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
    if (!newUser) throw new Error('Failed to create user');

    if (rolesIds.length) {
      const roleData = rolesIds.map(roleId => ({ roleId, userId: newUser.id, status: 1 }));
      await UsersRolesModel.insertMany(roleData);
    }

    await this.flushallCache();
    logger.info(`[Users] Created user id=${newUser.id}`);
    return newUser;
  }

  public static async modifyById(
    id?: number,
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
    if (id === undefined) throw new Error('User ID is required for modify operation');

    if (data.password) {
      data.salt = Utils.generateRandomString(6);
      data.password = Crypto.md5(`${data.password}${data.salt}`);
    }

    let rolesIds: number[] = [];
    if (data.roles) {
      rolesIds = (await RolesModel.findAll({ id: data.roles, status: 1 })).map(row => row.id);
      if (!rolesIds.length) throw new Error(`Invalid role id(s) ${data.roles}`);
    }

    const modifiedUser = await UsersModel.modifyById(id, data);
    if (!modifiedUser) throw new Error('Failed to modify user');

    if (rolesIds.length) {
      await UsersRolesModel.deleteByFilters({ userId: id });
      const roleData = rolesIds.map(roleId => ({ roleId, userId: id, status: 1 }));
      await UsersRolesModel.insertMany(roleData);
    }

    await this.flushallCache();
    return modifiedUser as InstanceType<typeof UsersModel>;
  }

  public static async modifyByFilters(
    filters: object | undefined = undefined,
    data: Record<string, unknown> = {}
  ): Promise<number | null> {
    const affects = await UsersModel.modifyByFilters(filters, data);
    await this.flushallCache();
    return affects;
  }

  public static async deleteById(id: number): Promise<number | null> {
    const affects = await UsersModel.deleteById(id);
    await this.flushallCache();
    return affects;
  }

  public static async deleteByFilters(filters: object | undefined = undefined): Promise<number | null> {
    const affects = await UsersModel.deleteByFilters(filters);
    await this.flushallCache();
    return affects;
  }

  public static async restoreById(id: number): Promise<number | null> {
    const affects = await UsersModel.restoreById(id);
    await this.flushallCache();
    return affects;
  }

  public static async restoreByFilters(filters: object | undefined = undefined): Promise<number | null> {
    const affects = await UsersModel.restoreByFilters(filters);
    await this.flushallCache();
    return affects;
  }

  public static async forceDelete(filters: object | undefined = undefined): Promise<number | null> {
    return await UsersModel.forceDelete(filters);
  }

  // ============================================================
  // 缓存清理
  // ============================================================
  public static async clearUserCache(user: UsersModel) {
    await Promise.all([
      CacheService.forget(`${this.cacheKey}[id:${user.id}]`),
      CacheService.forget(`${this.cacheKey}[uuid:${user.uuid}]`),
      CacheService.forget(`${this.cacheKey}[token:${user.rememberToken}]`),
      CacheService.forget(`${this.cacheKey}[account:${user.nickname}]`),
      CacheService.forget(`${this.cacheKey}[account:${user.email}]`),
      CacheService.forget(`${this.cacheKey}[account:${user.mobile}]`),
    ]);
  }

  public static async flushallCache() {
    await CacheService.forgetByPattern(`${this.cacheKey}[*]`);
  }
}
