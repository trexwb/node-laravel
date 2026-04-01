/*
 * @Author: trexwb
 * @Date: 2026-02-05 14:03:32
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-01 14:49:58
 * @FilePath: /node-laravel/src/app/Models/ServersModel.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import { QueryBuilder } from 'objection';
import { config } from '#bootstrap/configLoader';
import { BaseModel } from '#app/Models/BaseModel';

export class ServersModel extends BaseModel {
  // 显式声明属性，对应数据库字段
  id!: number;
  name!: string;
  url!: string;
  key!: string;
  appId!: number;
  appSecret!: string;
  appIv!: string;
  extension!: object;
  status!: number;
  updatedAt!: Date;
  createdAt!: Date;
  deletedAt!: Date | null;
  static softDelete = true;
  static inserTable = ['name', 'url', 'key', 'appId', 'appSecret', 'appIv', 'extension', 'status'];

  static get tableName() {
    return `${config('database.prefix')}servers`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'url', 'key', 'appId'], // 必填字段
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        url: { type: 'string' },
        key: { type: 'string' },
        appId: { type: 'string', maxLength: 40 },
        appSecret: { type: 'string', maxLength: 40 },
        appIv: { type: 'string', maxLength: 40 },
        extension: { type: 'object' },
        status: { type: 'integer', minimum: 0, maximum: 1 },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        deletedAt: { type: ['string', 'null'] },
      }
    };
  }

  // 定义 JSON 字段（Objection 会自动序列化/反序列化）
  static get jsonAttributes() {
    return ['extension'];
  }

  static getSchemaColumns(): string[] {
    return Object.keys(this.jsonSchema?.properties ?? {});
  }

  static getSchemaDbColumns() {
    const props = Object.keys(this.jsonSchema?.properties ?? {});
    const mapper = this.columnNameMappers;
    if (!mapper?.format) {
      return props;
    }
    return props.map((prop) => {
      const mapped = mapper.format({ [prop]: null });
      return Object.keys(mapped)[0];
    });
  }

  // 👇 核心：通用查询构建器（返回 QueryBuilder）
  static buildQuery(
    query: QueryBuilder<ServersModel> = this.query(),
    filters: {
      id?: { not?: number | number[]; eq?: number | number[]; } | number | number[] | string[];
      name?: string;
      url?: string;
      key?: string;
      appId?: number;
      status?: string | number | number[];
      keywords?: string;
    } = {},
    trashed: boolean = false
  ): QueryBuilder<ServersModel> {
    function applyCondition(field: string, value: any, isNot: boolean = false) {
      const isArray = Array.isArray(value);
      if (isNot) {
        isArray ? query.whereNotIn(field, value) : query.whereNot(field, value);
      } else {
        isArray ? query.whereIn(field, value) : query.where(field, value);
      }
    }
    if (!filters) return query;
    const table = this.tableName;
    // 处理 ID 过滤器 (支持 简单值, 数组, 或 {eq, not} 对象)
    if (filters.id !== undefined && filters.id !== null) {
      const id = filters.id;
      if (typeof id === 'object' && !Array.isArray(id)) {
        // 处理高级对象格式: { eq, not }
        if (id.eq !== undefined) applyCondition(`${table}.id`, id.eq);
        if (id.not !== undefined) applyCondition(`${table}.id`, id.not, true);
      } else {
        applyCondition(`${table}.id`, id);
      }
    }
    if (filters.keywords) {
      const keywords = filters.keywords.trim().split(/\s+/); // 按一个或多个空格拆分
      keywords.forEach(keyword => {
        query.where(function () {
          this.orWhereRaw(`LOCATE(?, \`${table}\`.\`name\`) > 0`, [keyword])
            .orWhereRaw(`LOCATE(?, \`${table}\`.\`url\`) > 0`, [keyword])
            .orWhereRaw(`LOCATE(?, \`${table}\`.\`key\`) > 0`, [keyword])
            .orWhereRaw(`LOCATE(?, \`${table}\`.\`app_id\`) > 0`, [keyword])
            .orWhereRaw(`LOCATE(?, \`${table}\`.\`permissions\`) > 0`, [keyword])
            .orWhereRaw(`LOCATE(?, \`${table}\`.\`extension\`) > 0`, [keyword])
        });
      });
    }
    if (filters.name) {
      query.where(`${table}.name`, filters.name);
    }
    if (filters.url) {
      query.where(`${table}.url`, filters.url);
    }
    if (filters.key) {
      query.where(`${table}.key`, filters.key);
    }
    if (trashed) {
      query.whereNotNull(`${table}.deleted_at`);
    } else {
      query.whereNull(`${table}.deleted_at`);
    }
    return query;
  }

  // 查询单个appId
  static async findByAppId(appId: number) {
    const query = this.buildQuery(this.query(), { appId });
    return await query.first(); // 或 .limit(1).first()
  }

  // 查询单个appId
  static async findByKey(key: string) {
    const query = this.buildQuery(this.query(), { key });
    return await query.first(); // 或 .limit(1).first()
  }
}