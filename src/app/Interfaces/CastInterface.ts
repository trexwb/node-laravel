/*
 * @Author: trexwb
 * @Date: 2026-01-22
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-17
 * @FilePath: node-laravel/src/app/Interfaces/CastInterface.ts
 * @Description: 模型字段类型转换契约 — 所有 Cast 实现类必须实现 get/set 两个方法
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

/** 模型字段类型转换契约（CastBoolean / CastDateTime / CastJson 均实现此契约） */
export interface CastInterface {
  get(value: unknown): unknown
  set(value: unknown): unknown
}
