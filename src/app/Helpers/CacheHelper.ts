/*
 * @Author: trexwb
 * @Date: 2026-03-24 09:47:40
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-24 09:54:50
 * @FilePath: /stl-dev-server/server/src/app/Helpers/CacheHelper.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

/**
 * 缓存键构建器类
 */
export class CacheKeyBuilder {
  private prefix: string
  private parts: string[] = []

  constructor(prefix: string) {
    this.prefix = prefix
  }

  /**
   * 添加 ID 部分
   */
  addId(id: number | string): CacheKeyBuilder {
    this.parts.push(`id:${id}`)
    return this
  }

  /**
   * 添加 UUID 部分
   */
  addUuid(uuid: string): CacheKeyBuilder {
    this.parts.push(`uuid:${uuid}`)
    return this
  }

  /**
   * 添加 Token 部分
   */
  addToken(token: string): CacheKeyBuilder {
    this.parts.push(`token:${token}`)
    return this
  }

  /**
   * 添加账户部分
   */
  addAccount(account: string): CacheKeyBuilder {
    this.parts.push(`account:${account}`)
    return this
  }

  /**
   * 添加列表查询部分
   */
  addList(params: unknown): CacheKeyBuilder {
    this.parts.push(`list:${this.serialize(params)}`)
    return this
  }

  /**
   * 添加关联查询部分
   */
  addGraph(graphExpr: string): CacheKeyBuilder {
    this.parts.push(`graph:${graphExpr}`)
    return this
  }

  /**
   * 添加软删除标记
   */
  addTrashed(trashed: boolean): CacheKeyBuilder {
    if (trashed) {
      this.parts.push('trashed:1')
    }
    return this
  }

  /**
   * 添加自定义部分
   */
  addCustom(key: string, value: unknown): CacheKeyBuilder {
    this.parts.push(`${key}:${this.serialize(value)}`)
    return this
  }

  /**
   * 构建完整的缓存键
   */
  build(): string {
    if (this.parts.length === 0) {
      return this.prefix
    }
    return `${this.prefix}[${this.parts.join(',')}]`
  }

  /**
   * 序列化参数为 JSON 字符串（带排序）
   */
  private serialize(params: unknown): string {
    if (!params) return ''

    // 递归排序对象键
    const sortObject = (obj: unknown): unknown => {
      if (!obj || typeof obj !== 'object') return obj

      if (Array.isArray(obj)) {
        return obj.map((item) => (typeof item === 'object' && item !== null ? sortObject(item) : item))
      }

      const sortedObj: Record<string, unknown> = {}
      const source = obj as Record<string, unknown>
      Object.keys(source)
        .sort()
        .forEach((key) => {
          sortedObj[key] = sortObject(source[key])
        })

      return sortedObj
    }

    try {
      return JSON.stringify(sortObject(params))
    } catch {
      return ''
    }
  }
}

/**
 * 快速构建列表缓存键
 * @param prefix - 缓存键前缀
 * @param params - 查询参数对象
 * @returns 完整的缓存键
 */
export const buildListKey = (prefix: string, params: unknown): string => {
  return new CacheKeyBuilder(prefix).addList(params).build()
}

/**
 * 快速构建详情缓存键
 * @param prefix - 缓存键前缀
 * @param id - 记录 ID
 * @param graphExpr - 关联图谱表达式（可选）
 * @returns 完整的缓存键
 */
export const buildDetailKey = (prefix: string, id: number | string, graphExpr?: string): string => {
  const builder = new CacheKeyBuilder(prefix).addId(id)
  if (graphExpr) {
    builder.addGraph(graphExpr)
  }
  return builder.build()
}

/**
 * 快速构建用户相关缓存键
 * @param userId - 用户 ID
 * @param userUuid - 用户 UUID（可选）
 * @param rememberToken - 记住令牌（可选）
 * @param account - 账户（邮箱或手机，可选）
 * @returns 缓存键数组
 */
export const buildUserCacheKeys = (userId: number, userUuid?: string, rememberToken?: string, account?: string): string[] => {
  const keys: string[] = []
  const prefix = 'users'

  // ID 缓存键
  keys.push(new CacheKeyBuilder(prefix).addId(userId).build())
  keys.push(`${prefix}[id:${userId}]`)

  // UUID 缓存键
  if (userUuid) {
    keys.push(new CacheKeyBuilder(prefix).addUuid(userUuid).build())
  }

  // Token 缓存键
  if (rememberToken) {
    keys.push(new CacheKeyBuilder(prefix).addToken(rememberToken).build())
  }

  // 账户缓存键
  if (account) {
    keys.push(new CacheKeyBuilder(prefix).addAccount(account).build())
  }

  return keys
}

/**
 * 生成缓存键模式（用于批量删除）
 * @param prefix - 缓存键前缀
 * @param pattern - 匹配模式
 * @returns 带通配符的缓存键模式
 */
export const buildCachePattern = (prefix: string, pattern: string): string => {
  return `${prefix}[${pattern}]*`
}
