/**
 * FilterHelper — 规范化 Controller 层的查询过滤器
 *
 * 背景：Controller 层常需要合并前端传入的 filter 与控制器默认条件，
 * 模式为 `req.body.filter || { id: req.body.id }`，导致大量重复代码
 * 和 `(req.body.filter || { id: req.body.id })` 的类型强制。
 *
 * 使用方式：
 *   import { buildFilter } from '#app/Helpers/FilterHelper'
 *   const filter = buildFilter(req, { status: 1 })
 *   // 或传入自定义覆盖字段
 *   const filter = buildFilter(req, { status: 1 }, { id: 'orderId' })
 */
import type { Request } from 'express'

/**
 * 从 req.body 提取 filter，缺失时以 id 字段兜底，
 * 并与 extra 条件合并（extra 优先级更高）。
 *
 * @param req        Express Request（含 body.filter/body.id 等）
 * @param extra      额外追加/覆盖的过滤条件（可选）
 * @param overrides  自定义字段映射，如 { id: 'orderId' } 表示用 req.body.orderId 替代 id
 */
export function buildFilter<T extends Record<string, unknown> = Record<string, unknown>>(
  req: Request,
  extra?: T,
  overrides?: Record<string, string>
): T {
  const body = req.body ?? {}
  let base: Record<string, unknown>

  // 优先用 filter，其次用 id（兼容旧接口）
  if (body.filter && typeof body.filter === 'object') {
    base = { ...body.filter }
  } else if (body.id !== undefined) {
    base = { id: body.id }
  } else {
    base = {}
  }

  // 应用字段覆盖（如 { id: 'orderId' } 表示 base.id = body.orderId）
  if (overrides) {
    for (const [srcField, dstField] of Object.entries(overrides)) {
      if (body[srcField] !== undefined) {
        if (dstField === 'id' && base.id === undefined) {
          base.id = body[srcField]
        } else {
          base[dstField] = body[srcField]
        }
      }
    }
  }

  // 合并 extra（extra 优先级最高）
  if (extra) {
    Object.assign(base, extra)
  }

  return base as T
}

/**
 * 快速构建单 ID 过滤条件（从 req.body 或 req.params 提取）。
 */
export function buildIdFilter(req: Request, paramName: 'id' | string = 'id'): Record<string, number> {
  const id = req.params[paramName] ?? req.body.id ?? req.query.id
  return { id: Number(id) }
}
