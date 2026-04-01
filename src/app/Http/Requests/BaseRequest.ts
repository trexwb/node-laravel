/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-01 14:56:06
 * @FilePath: /node-laravel/src/app/Http/Requests/BaseRequest.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import Validator from 'validatorjs';
import type { Request } from 'express';

Validator.register(
  'nullable',
  () => true,
);

export abstract class BaseRequest {
  protected req: Request;

  constructor(req: Request) {
    this.req = req;
  }

  /** 子类必须实现 */
  abstract rules(): Record<string, any>;

  /** 可选 */
  messages(): Record<string, string> {
    return {};
  }

  /** 是否有权限 */
  authorize(): boolean {
    return true;
  }

  /** 获取全部输入 */
  all() {
    return this.req.body;
  }

  /** 获取单个字段 */
  input<T = any>(key: string, defaultValue?: T): T {
    return this.req.body?.[key] ?? defaultValue;
  }

  /** 核心校验入口（Controller 只调用这个） */
  async validate<T = any>(): Promise<T> {
    if (!this.authorize()) {
      throw new Error('无权操作');
    }

    const data = this.all();
    const rules = this.rules();
    const validator = new Validator(data, this.rules(), this.messages());

    await this.registerAsyncRules();

    // 🔥 关键：异步校验必须用 checkAsync
    await new Promise<void>((resolve, reject) => {
      validator.checkAsync(
        () => resolve(),
        () => reject(validator.errors.all())
      );
    });

    // ✅ 根据 rules 生成返回对象，全部字段都 castValue
    // const casted: Record<string, any> = {};
    // for (const key of Object.keys(rules)) {
    //   casted[key] = this.castValue(data[key], rules[key]);
    // }
    // return casted as T;

    // ✅ 只保留 rules 中的字段
    const validated: Record<string, any> = {};
    for (const key of Object.keys(rules)) {
      if (key in data) {
        validated[key] = this.castValue(data[key], rules[key]);
      }
    }
    return validated as T;
  }

  private castValue(value: any, rule: string) {
    // 判断是否允许为空
    if (value === undefined || value === null) return value;
    const rules = rule.split('|');
    if (rules.includes('integer')) return Number(value);
    if (rules.includes('numeric')) return Number(value);
    if (rules.includes('boolean')) return Boolean(value);
    if (rules.includes('string')) return String(value);
    return value; // 默认不转换
  }
  /** 供子类覆盖：注册 async 规则 */
  protected async registerAsyncRules() { }
}
