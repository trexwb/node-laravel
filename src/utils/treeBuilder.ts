/*
 * @Author: trexwb
 * @Date: 2026-03-22 09:10:00
 * @LastEditors: ${git_name}
 * @LastEditTime: 2026-04-16 11:26:55
 * @FilePath: /stl-dev-server/server/src/utils/TreeBuilderHelper.ts
 * @Description:
 * 扁平列表 → 树形结构工具函数
 * 内存构建，O(n) 时间复杂度，避免递归查库
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { BuildTreeOptions, TreeItem } from '#types/helpers'
export type { BuildTreeOptions, TreeItem, TreeNode } from '#types/helpers'



/**
 * 树形节点类型：在原节点类型上追加递归 children
 */

/**
 * 扁平列表转树形结构（O(n) 内存构建，不递归查库）
 *
 * @param list 扁平数据列表
 * @param options 配置项
 * @returns 树形结构数组
 *
 * @example
 * const flat = [
 *   { id: 1, parentId: null, sort: 0, names: { zh-CN: '螺栓' } },
 *   { id: 2, parentId: 1,    sort: 0, names: { zh-CN: '六角螺栓' } },
 *   { id: 3, parentId: 1,    sort: 1, names: { zh-CN: '内六角螺栓' } },
 * ];
 * buildTree(flat);
 * // => [{ id: 1, parentId: null, children: [{ id: 2, ... }, { id: 3, ... }] }]
 */
export function buildTree<T extends object>(
  list: T[],
  options: BuildTreeOptions = {}
): TreeItem<T>[] {
  const { idKey = 'id', parentKey = 'parentId', sortKey = 'sort', rootValue = null, childrenKey = 'children' } = options

  // 1. 构建 id → node 映射（O(n)）
  const map = new Map<number, TreeItem<T>>()
  for (const item of list) {
    const row = item as unknown as Record<string, unknown>
    map.set(row[idKey] as number, { ...item, [childrenKey]: [] } as unknown as TreeItem<T>)
  }

  // 2. 遍历挂载子节点（O(n)）
  const roots: TreeItem<T>[] = []
  for (const item of list) {
    const row = item as unknown as Record<string, unknown>
    const node = map.get(row[idKey] as number)!
    const pid = row[parentKey]

    if (pid === rootValue || pid === undefined || pid === null) {
      roots.push(node)
    } else {
      const parent = map.get(pid as number)
      if (parent) {
        const children = (parent as unknown as Record<string, unknown>)[childrenKey] as unknown as TreeItem<T>[]
        children.push(node)
      } else {
        // 父节点不在列表中（可能被过滤掉），作为根节点处理
        roots.push(node)
      }
    }
  }

  // 3. 递归排序（仅排序，不查库）
  const sortNodes = (nodes: TreeItem<T>[]) => {
    nodes.sort((a, b) => {
      const aRow = a as unknown as Record<string, unknown>
      const bRow = b as unknown as Record<string, unknown>
      return Number(aRow[sortKey] ?? 0) - Number(bRow[sortKey] ?? 0)
    })
    for (const node of nodes) {
      const children = (node as unknown as Record<string, unknown>)[childrenKey] as unknown as TreeItem<T>[] | undefined
      if (children && children.length > 0) {
        sortNodes(children)
      }
    }
  }
  sortNodes(roots)

  return roots
}

/**
 * 树形结构转扁平列表（深度优先）
 *
 * @param tree 树形结构数组
 * @param childrenKey 子节点字段名，默认 'children'
 * @returns 扁平列表（不含 children 字段）
 */
export function flattenTree<T extends object>(tree: T[], childrenKey = 'children'): Omit<T, 'children'>[] {
  const result: Omit<T, 'children'>[] = []
  const stack = [...tree]
  while (stack.length > 0) {
    const node = stack.shift()!
    const { [childrenKey]: children, ...rest } = node as unknown as Record<string, unknown>
    result.push(rest as unknown as Omit<T, 'children'>)
    if (Array.isArray(children) && children.length > 0) {
      stack.unshift(...children)
    }
  }
  return result
}

/**
 * 获取节点的所有祖先 ID（从根到父）
 *
 * @param id 目标节点 ID
 * @param flatList 扁平列表
 * @param idKey 主键字段名，默认 'id'
 * @param parentKey 父节点字段名，默认 'parentId'
 * @returns 祖先 ID 数组（从根到父）
 */
export function getAncestorIds(id: number, flatList: Record<string, unknown>[], idKey = 'id', parentKey = 'parentId'): number[] {
  const map = new Map<number, Record<string, unknown>>()
  for (const item of flatList) {
    map.set(item[idKey] as number, item)
  }

  const ancestors: number[] = []
  let current = map.get(id)
  while (current !== undefined && current !== null) {
    const pid = current[parentKey]
    if (pid === null || pid === undefined) break
    ancestors.unshift(pid as number)
    current = map.get(pid as number)
  }
  return ancestors
}

/**
 * 获取节点的所有后代 ID（含自身）
 *
 * @param id 目标节点 ID
 * @param flatList 扁平列表
 * @param idKey 主键字段名，默认 'id'
 * @param parentKey 父节点字段名，默认 'parentId'
 * @returns 后代 ID 数组（含自身）
 */
export function getDescendantIds(id: number, flatList: Record<string, unknown>[], idKey = 'id', parentKey = 'parentId'): number[] {
  const result: number[] = [id]
  const queue = [id]
  while (queue.length > 0) {
    const pid = queue.shift()!
    for (const item of flatList) {
      if (item[parentKey] === pid) {
        result.push(item[idKey] as number)
        queue.push(item[idKey] as number)
      }
    }
  }
  return result
}
