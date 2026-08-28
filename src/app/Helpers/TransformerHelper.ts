/*
 * @Author: trexwb
 * @Date: 2026-04-10 11:35:00
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-10 11:35:00
 * @FilePath: /stl-dev-server/server/src/app/Helpers/TransformerHelper.ts
 * @Description:
 * 数据转换工具函数（Transformer Helper）
 * 用于 API 响应字段过滤、结构化转换
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

/**
 * 递归过滤树形节点字段
 * 仅保留指定字段，对 children 递归应用相同规则
 *
 * @param node 单个节点或节点数组
 * @param fields 允许的字段列表
 * @param childrenKey 子节点字段名，默认 'children'
 * @returns 过滤后的节点（递归处理 children）
 *
 * @example
 * const tree = [{ id: 1, names: {...}, createdAt: '...', children: [{ id: 2, ... }] }];
 * filterTreeNodeFields(tree, ['id', 'names', 'children']);
 * // => [{ id: 1, names: {...}, children: [{ id: 2, ... }] }]
 */
export function filterTreeNodeFields<T extends Record<string, unknown>>(
  node: T | T[],
  fields: string[],
  childrenKey = 'children'
): Partial<T> | Partial<T>[] {
  // 处理数组
  if (Array.isArray(node)) {
    return node.map((item) => filterTreeNodeFieldsSingle(item, fields, childrenKey)) as Partial<T>[]
  }
  // 处理单个节点
  return filterTreeNodeFieldsSingle(node, fields, childrenKey) as Partial<T>
}

/**
 * 单节点字段过滤（内部函数）
 */
function filterTreeNodeFieldsSingle<T extends Record<string, unknown>>(node: T, fields: string[], childrenKey: string): Partial<T> {
  const result: Partial<T> = {}

  // 仅保留指定字段
  for (const field of fields) {
    if (field in node) {
      result[field as keyof T] = node[field as keyof T]
    }
  }

  // 递归处理 children
  const children = node[childrenKey as keyof T]
  if (childrenKey in node && Array.isArray(children) && children.length > 0) {
    result[childrenKey as keyof T] = (children as T[]).map((child) =>
      filterTreeNodeFieldsSingle(child, fields, childrenKey)
    ) as T[keyof T]
  }

  return result
}

/**
 * 批量转换扁平列表（非树形）
 *
 * @param list 数据列表
 * @param fields 允许的字段列表
 * @returns 过滤后的列表
 *
 * @example
 * const items = [{ id: 1, names: {...}, createdAt: '...' }];
 * filterFlatFields(items, ['id', 'names']);
 * // => [{ id: 1, names: {...} }]
 */
export function filterFlatFields<T extends Record<string, unknown>>(list: T[], fields: string[]): Partial<T>[] {
  return list.map((item) => {
    const result: Partial<T> = {}
    for (const field of fields) {
      if (field in item) {
        result[field as keyof T] = item[field as keyof T]
      }
    }
    return result
  })
}

/**
 * 分类树专用字段过滤
 * 核心字段：id, names, abbreviation, covers, remarks, total, sort, children
 *
 * @param tree 树形结构数据
 * @returns 过滤后的树形结构
 */
export function filterCategoryTreeFields<T extends Record<string, unknown>>(tree: T | T[]): Partial<T> | Partial<T>[] {
  const CATEGORY_FIELDS = ['id', 'names', 'abbreviation', 'covers', 'remarks', 'total', 'sort', 'children']
  return filterTreeNodeFields(tree, CATEGORY_FIELDS)
}
