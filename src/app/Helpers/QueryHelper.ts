/*
 * @Author: trexwb
 * @Date: 2026-03-24 09:45:06
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-17 15:21:00
 * @FilePath: /stl/server/src/app/Helpers/QueryHelper.ts
 * @Description:
 * 查询辅助函数 — 纯函数，可独立使用
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { BaseModel } from '#app/Models/BaseModel'

/**
 * 从 Model 提取数据库列名列表
 * @param ModelClass - Objection Model 类
 * @returns 数据库列名数组
 */
export const extractSchemaColumns = (ModelClass: typeof BaseModel): string[] => {
  // 优先调用 Model 的 getSchemaDbColumns 方法
  if (typeof ModelClass.getSchemaDbColumns === 'function') {
    return ModelClass.getSchemaDbColumns()
  }

  // 从 jsonSchema 推导
  const properties = Object.keys(ModelClass.jsonSchema?.properties ?? {})
  const mapper = ModelClass.columnNameMappers

  if (!mapper?.format) {
    return properties
  }

  // 使用映射函数转换列名
  return properties.map((prop: string) => {
    const mapped = mapper.format({ [prop]: null })
    return Object.keys(mapped)[0]
  })
}
