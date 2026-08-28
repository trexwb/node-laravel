/***
 * @Author: trexwb
 * @Date: 2026-07-17 15:09:29
 * @LastEditors: trexwb
 * @LastEditTime: 2026-07-17 15:14:29
 * @FilePath: /stl/server/src/app/Models/BaseModel.ts
 * @Description:
 * @一花一世界，一叶一如来
 * @Copyright (c) 2026 by 杭州大美, All Rights Reserved.
 */
import type { CastInterface } from '#app/Interfaces/CastInterface'
import { config } from '#bootstrap/configLoader'
import type { AppError } from '#types/errors'
import type { FilterValue, SchemaProp, SchemaProps } from '#types/models'
import type { SortOrder } from '#types/query'
import { DEFAULT_TIME_ZONE, formatDateFromUTC, formatDbDateTimeFromUTC, nowDate } from '#app/Helpers/format'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'
import * as _ from 'lodash-es'
import type { JSONSchema, ModelOptions, Pojo } from 'objection'
import { Model, QueryBuilder, snakeCaseMappers } from 'objection'
dayjs.extend(utc)
dayjs.extend(timezone)

// ─── 类型定义已收敛至 #types/models（SchemaProp / SchemaProps / FilterValue）───
/** 取出 jsonSchema.properties（对所有子类统一调用） */
function getSchemaProps(ctor: typeof BaseModel): SchemaProps | undefined {
  return ctor.jsonSchema?.properties as unknown as SchemaProps | undefined
}

/** 将 type 字段统一规范为字符串数组 */
function normalizeTypes(type: string | string[] | undefined): string[] {
  if (!type) return []
  return Array.isArray(type) ? type.map(String) : [String(type)]
}

// ─── BaseModel ───────────────────────────────────────────────────────────────

export class BaseModel extends Model {
  protected static table: string
  protected static primaryKey: string = 'id'
  protected static fillable: string[] = []
  protected static hidden: string[] = []
  protected static casts: Record<string, CastInterface | string> = {}
  protected static useTimestamps: boolean = true
  /** 子类声明允许 insert 的字段白名单 */
  static inserTable: readonly string[] = []
  /** 是否支持软删除（默认 false） */
  static softDelete = false
  /** 软删除字段名（可覆盖） */
  static softDeleteColumn = 'deletedAt'

  // ══════════════════════════════════════════════════════════════════════════
  // §1  通用 sanitize 辅助
  //     处理所有"可安全写入数据库"所需的原子操作
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * 按 jsonSchema.properties 的 type 定义对单个值做最宽松的类型强制转换。
   *
   * 设计原则：
   *  - 只做能"无损"转换的部分（string→number、string→bool）
   *  - 无法转换的值原样返回，交给 Ajv 报验证错误给调用方
   *  - 不抛出任何运行时异常（"自愈"而非崩溃）
   */
  protected static sanitizeValue(value: unknown, prop: SchemaProp): unknown {
    if (value === null || value === undefined) return value

    // ── format 优先处理 ────────────────────────────────────────────────
    if (prop.format === 'date-time' || prop.format === 'date') {
      return this.coerceDateTime(value, prop.format)
    }

    // email：统一小写（不抛异常，无效值让 Ajv 报错）
    if (prop.format === 'email') {
      if (typeof value === 'string') return value.trim().toLowerCase()
      return value
    }

    // uuid：标准化为小写连字符格式（无效时保留原值，由 Ajv 兜底报错）
    if (prop.format === 'uuid') {
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase()
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized)) {
          return normalized
        }
      }
      return value
    }

    const types = normalizeTypes(prop.type).filter((t) => t !== 'null')

    for (const t of types) {
      switch (t) {
        case 'integer': {
          let n: number
          if (typeof value === 'number') {
            n = value
          } else {
            n = Number(value)
            if (!Number.isFinite(n)) return value
          }
          // minimum / maximum 边界约束（clamp）
          let rounded = Math.round(n)
          if (prop.minimum !== undefined) rounded = Math.max(rounded, prop.minimum)
          if (prop.maximum !== undefined) rounded = Math.min(rounded, prop.maximum)
          return rounded
        }
        case 'number': {
          if (typeof value === 'number') {
            let n = value
            if (prop.minimum !== undefined) n = Math.max(n, prop.minimum)
            if (prop.maximum !== undefined) n = Math.min(n, prop.maximum)
            return n
          }
          const n = Number(value)
          if (!Number.isFinite(n)) return value
          // P3 修复：旧代码此处两行比较/调用无赋值副作用（悬空语句），钳制逻辑仅在下两行生效
          if (prop.minimum !== undefined) return Math.max(n, prop.minimum)
          if (prop.maximum !== undefined) return Math.min(n, prop.maximum)
          return n
        }
        case 'boolean': {
          if (typeof value === 'boolean') return value
          if (value === 'true' || value === '1' || value === 1) return true
          if (value === 'false' || value === '0' || value === 0) return false
          return value
        }
        case 'object': {
          // 嵌套对象递归 sanitize
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            if (prop.properties || prop.additionalProperties !== undefined) {
              return this.coerceObject(value, prop)
            }
          }
          if (typeof value === 'string') {
            try {
              return JSON.parse(value)
            } catch {
              return value
            }
          }
          return value
        }
        case 'array': {
          // 数组内对象递归 sanitize
          if (Array.isArray(value)) {
            return this.coerceArray(value, prop)
          }
          if (typeof value === 'string') {
            try {
              return this.coerceArray(JSON.parse(value), prop)
            } catch {
              return value
            }
          }
          return value
        }
        case 'string': {
          let str: string
          // Date 对象：转 ISO 字符串（不带引号）
          // ⚠️ 不能用 JSON.stringify(Date)，它会返回带双引号的字符串
          //    （如 `"2026-07-17T05:41:04.096Z"`），后续 dayjs 解析会失败
          if (value instanceof Date) {
            if (isNaN(value.getTime())) return null
            str = value.toISOString()
          } else if (typeof value === 'object' && value !== null) {
            // 对象/数组序列化为 JSON 字符串
            str = JSON.stringify(value)
          } else {
            str = String(value)
          }
          // ── pattern 约束：替换非法字符 ───────────────────────────────────
          if (prop.pattern) {
            try {
              str = str.replace(/[^a-zA-Z0-9_\-\s@.+]/g, '_')
            } catch {
              /* 无效正则，原样保留 */
            }
          }
          // minLength 截断补齐（不抛异常）
          if (prop.minLength !== undefined && str.length < prop.minLength) {
            str = str.padEnd(prop.minLength, ' ')
          }
          // maxLength 截断（保留前缀）
          if (prop.maxLength !== undefined && str.length > prop.maxLength) {
            str = str.slice(0, prop.maxLength)
          }
          return str
        }
      }
    }
    return value
  }

  /**
   * 遍历 data 对象，对每个字段按 jsonSchema 定义调用 sanitizeValue，
   * 并对 string 类型字段做：
   *  - 去除首尾空格
   *  - 过滤控制字符（防止非法编码注入）
   *
   * 注意：此方法返回新对象，不修改原始引用。
   */
  protected static sanitize(data: Record<string, any>): Record<string, any> {
    const props = getSchemaProps(this)
    if (!props) return { ...data }

    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      const prop = props[key]
      if (!prop) {
        // 不在 schema 定义中的字段：透传（由 filterSchemaFields 在写操作前过滤）
        result[key] = value
        continue
      }
      let sanitized = this.sanitizeValue(value, prop)
      // string 字段额外清理
      if (typeof sanitized === 'string') {
        sanitized = sanitized
          // 去除首尾空格
          .trim()
          // 过滤 ASCII 控制字符（\x00-\x1F，保留 \t \n \r）
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      }
      result[key] = sanitized
    }
    return result
  }

  /** 日期时间强制转换，失败时返回原值（让 Ajv 报错） */
  protected static coerceDateTime(value: unknown, format: string): unknown {
    if (value instanceof Date) {
      // Invalid Date 保护：dayjs(invalidDate).tz() 会抛 RangeError
      if (isNaN(value.getTime())) return null
      // Date 对象：用 dayjs(date).tz() 正确转换时区
      // ⚠️ 不能用 dayjs.tz(date, TZ)，它会将 UTC 值误判为本地时间
      return format === 'date-time' ? formatDbDateTimeFromUTC(value) : formatDateFromUTC(value, 'YYYY-MM-DD')
    }
    if (typeof value === 'string' && value.trim()) {
      const raw = value.trim()
      // 已经是标准 datetime/date 格式的字符串，无需经过 new Date() 中转
      // ⚠️ 在 UTC 系统（Docker）上，new Date("19:07:08") 会错误解析为 UTC，
      //    再经 dayjs.tz(Date, TZ) 转换会导致 +8h 偏移
      if (format === 'date-time' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) {
        return raw // 已经是 "YYYY-MM-DD HH:mm:ss" 格式，直接返回
      }
      if (format === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return raw // 已经是 "YYYY-MM-DD" 格式，直接返回
      }
      // 其他格式字符串（ISO 8601 等）：用 dayjs.tz(string, TZ) 解析
      try {
        const parsed = dayjs.tz(raw, DEFAULT_TIME_ZONE)
        if (parsed.isValid()) {
          return format === 'date-time' ? parsed.format('YYYY-MM-DD HH:mm:ss') : parsed.format('YYYY-MM-DD')
        }
      } catch {
        /* 返回原值 */
      }
    }
    if (typeof value === 'number') {
      // 时间戳：解释为 UTC，再转为应用时区
      // ⚠️ NaN/Infinity 保护
      if (!Number.isFinite(value)) return value
      const ts = value > 1e12 ? value : value * 1000
      return format === 'date-time' ? formatDbDateTimeFromUTC(new Date(ts)) : formatDateFromUTC(new Date(ts), 'YYYY-MM-DD')
    }
    return value
  }

  /**
   * 嵌套对象强制转换与过滤
   *
   * 处理场景：
   *  - additionalProperties: false → 过滤 schema 外字段
   *  - properties 定义 → 按子属性递归 sanitize
   *  - required 字段缺失 → 不补全（由 Ajv 报错）
   */
  protected static coerceObject(value: unknown, prop: SchemaProp): unknown {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return value

    const result: Record<string, any> = {}
    const definedProps = prop.properties || {}
    const additionalProps = prop.additionalProperties

    for (const [k, v] of Object.entries(value)) {
      // 已知属性 → 递归 sanitize
      if (k in definedProps) {
        result[k] = this.sanitizeValue(v, definedProps[k])
        continue
      }
      // additionalProperties: false → 丢弃
      if (additionalProps === false) continue
      // additionalProperties: true 或 undefined → 原样透传
      result[k] = v
    }
    return result
  }

  /**
   * 数组强制转换与约束
   *
   * 处理场景：
   *  - uniqueItems: true → 去重（按 JSON 字符串比较）
   *  - minItems / maxItems → 截断
   *  - items.schema → 递归 sanitize 每个元素（支持嵌套对象）
   */
  protected static coerceArray(value: unknown[], prop: SchemaProp): unknown[] {
    if (!Array.isArray(value)) return value

    let items = value

    // uniqueItems 去重
    if (prop.uniqueItems) {
      const seen = new Set<string>()
      items = items.filter((v) => {
        const key = typeof v === 'object' ? JSON.stringify(v) : String(v)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }

    // minItems 补齐（填充 null，与 Ajv 校验分离）
    if (prop.minItems !== undefined && items.length < prop.minItems) {
      items = [...items, ...Array(prop.minItems - items.length).fill(null)]
    }

    // maxItems 截断
    if (prop.maxItems !== undefined && items.length > prop.maxItems) {
      items = items.slice(0, prop.maxItems)
    }

    // items.schema 递归 sanitize
    if (prop.items) {
      items = items.map((v) => this.sanitizeValue(v, prop.items as SchemaProp))
    }

    return items
  }

  // ══════════════════════════════════════════════════════════════════════════
  // §2  Objection 生命周期钩子
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * $beforeValidate — 在 Ajv 验证前运行
   *
   * 职责：
   *  - string 字段：去首尾空格、过滤控制字符
   *  - number/integer 字段：从 string 强制转型（使 Ajv 能通过）
   *  - boolean 字段：从 string/number 强制转型
   *  - date-time / date format 字段：统一格式化
   *
   * 不抛出异常：无法转换的值原样保留，让 Ajv 做最终校验并向调用方报错。
   */
  $beforeValidate(jsonSchema: JSONSchema, json: Pojo, _opt: ModelOptions): JSONSchema {
    const props = getSchemaProps(this.constructor as typeof BaseModel)
    if (!props) return jsonSchema

    for (const key of Object.keys(json)) {
      const val = json[key]
      if (val === null || val === undefined) continue

      const prop = (props as SchemaProps)?.[key]
      if (!prop) continue

      const types = normalizeTypes(prop.type)

      // ── string 字段：trim + 过滤控制字符 ────────────────────────────────
      if (typeof val === 'string') {
        let trimmed = val.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // 如果 schema 需要 number/integer，将纯数字字符串转为数字
        if (types.includes('integer') || types.includes('number')) {
          if (/^-?(\d+\.?\d*|\.\d+)$/.test(trimmed)) {
            json[key] = types.includes('integer') ? parseInt(trimmed, 10) : parseFloat(trimmed)
            continue
          }
        }
        // 如果 schema 需要 boolean，转换常见布尔值字符串
        if (types.includes('boolean')) {
          if (trimmed === 'true' || trimmed === '1') {
            json[key] = true
            continue
          }
          if (trimmed === 'false' || trimmed === '0') {
            json[key] = false
            continue
          }
        }
        // 如果 schema 是 date-time 格式（常见于 nullable datetime 字段），
        // 将 "null" / 空字符串 统一转为 null，避免 AJV format: 'date-time' 验证失败
        if (prop.format === 'date-time') {
          if (trimmed === 'null' || trimmed === '') {
            json[key] = null
            continue
          }
        }
        json[key] = trimmed
        continue
      }

      // ── number/integer 字段：已是 number，边界约束由 Ajv 处理 ───────────
      // ── boolean 字段：已是 boolean，Ajv 校验直接通过 ────────────────────
      // ── 其他类型原样保留 ────────────────────────────────────────────────
    }
    return jsonSchema
  }

  /**
   * $parseJson — HTTP 输入对象 → 模型实例前的类型修正
   *
   * 作为 $beforeValidate 的备用路径（部分 Objection 版本的调用顺序差异），
   * 保持与 $beforeValidate 一致的 coerce 逻辑。
   */
  $parseJson(json: Pojo): Pojo {
    json = super.$parseJson(json)
    const props = getSchemaProps(this.constructor as typeof BaseModel)
    if (!props) return json

    for (const [key, prop] of Object.entries(props)) {
      if (!(key in json)) continue
      const val = json[key]
      if (val === null || val === undefined) continue
      json[key] = (this.constructor as typeof BaseModel).sanitizeValue(val, prop)
    }
    return json
  }

  $parseDatabaseJson(json: Pojo): Pojo {
    json = super.$parseDatabaseJson(json)
    for (const key of Object.keys(json)) {
      const value = json[key]
      const prop = getSchemaProps(this.constructor as typeof BaseModel)?.[key]
      const isDateTimeField = key.endsWith('At') || key.endsWith('_at') || prop?.format === 'date-time'

      if (!isDateTimeField || value === null || value === undefined) continue

      if (value instanceof Date) {
        json[key] = formatDateFromUTC(value)
        continue
      }

      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(value)) {
        json[key] = formatDateFromUTC(value)
      }
    }
    return json
  }

  /**
   * $formatDatabaseJson — JS 对象写入 DB 前的最终处理
   *
   * 职责（按顺序）：
   *  A. 过滤掉不属于数据库列的属性（基于 jsonSchema.properties，若有定义）
   *  B. 对 *_at / *At 字段统一格式化为 MySQL DATETIME（YYYY-MM-DD HH:mm:ss）
   *  C. 确保 boolean 字段写入为 0/1 而非 true/false（MySQL tinyint 兼容）
   *  D. 确保 Date 对象转字符串（部分 mysql2 版本不自动处理）
   *  E. 对 object / array 字段序列化为 JSON 字符串（写 TEXT/JSON 列）
   */
  $formatDatabaseJson(json: Pojo): Pojo {
    const formatted = super.$formatDatabaseJson(json)
    const props = getSchemaProps(this.constructor as typeof BaseModel)

    const result: Pojo = {}
    for (const [key, value] of Object.entries(formatted)) {
      // A. 若 schema 有定义，跳过 schema 之外的字段
      // 注意：Objection DB 层 key 为 snake_case，props 为 camelCase，需双向转换比对
      const camelKey = _.camelCase(key)
      if (props && !(key in props) && !(camelKey in props)) continue

      const prop: SchemaProp | undefined = props?.[key] ?? (props?.[camelKey] as SchemaProp)
      result[key] = this.formatForDb(key, value, prop)
    }
    return result
  }

  /** 将任意日期时间输入统一格式化为上海时区 MySQL DATETIME 字符串 */
  formatDateTimeForDb(value: unknown): unknown {
    if (value === null || value === undefined) return value

    if (value instanceof Date) {
      // ⚠️ Invalid Date 的 getTime()返回NaN，dayjs.utc(NaN).tz()会抛RangeError
      if (isNaN(value.getTime())) return null
      return formatDbDateTimeFromUTC(value)
    }

    if (typeof value === 'string') {
      const raw = value.trim()
      if (!raw) return null
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) return raw

      try {
        const parsed =
          raw.endsWith('Z') || /^\d{4}-\d{2}-\d{2}T/.test(raw) || /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+\-]\d{2}:?\d{2}$/.test(raw)
            ? dayjs.utc(raw).tz(DEFAULT_TIME_ZONE)
            : dayjs.tz(raw, DEFAULT_TIME_ZONE)

        return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : raw
      } catch {
        // tzdata 缺失时 dayjs().tz() 会抛 RangeError，降级返回原始字符串
        return raw
      }
    }

    if (typeof value === 'number') {
      // ⚠️ NaN/Infinity 传入 formatDbDateTimeFromUTC 会触发 dayjs.utc(NaN).tz() → RangeError
      if (!Number.isFinite(value)) return null
      return formatDbDateTimeFromUTC(value)
    }

    return value
  }

  /** 对单个字段值做入库格式化 */
  formatForDb(key: string, value: unknown, prop?: SchemaProp): unknown {
    if (value === null || value === undefined) return value

    // B. *_at / *At 时间字段
    const isAtField = key.endsWith('At') || key.endsWith('_at')
    if (isAtField || prop?.format === 'date-time') return this.formatDateTimeForDb(value)

    // format 字段
    if (prop?.format === 'date') {
      if (value instanceof Date) {
        if (isNaN(value.getTime())) return null
        return formatDateFromUTC(value, 'YYYY-MM-DD')
      }
    }

    // D. 剩余 Date 对象
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return null
      return formatDbDateTimeFromUTC(value)
    }

    // C. boolean → 0/1
    if (typeof value === 'boolean') return value ? 1 : 0

    // E. object / array → JSON string
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }

    return value
  }

  $formatJson(json: Pojo): Pojo {
    json = super.$formatJson(json)
    for (const key of Object.keys(json)) {
      const value = json[key]
      const prop = getSchemaProps(this.constructor as typeof BaseModel)?.[key]
      const isDateTimeField = key.endsWith('At') || key.endsWith('_at') || prop?.format === 'date-time'
      if (!isDateTimeField) continue

      if (value instanceof Date) {
        json[key] = formatDateFromUTC(value)
      } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(value)) {
        json[key] = formatDateFromUTC(value)
      }
    }
    return json
  }

  getUpdatedAtAttribute(value: string | Date) {
    // 数据库 TIMESTAMP 列返回的 Date 对象是 UTC 值，需用 formatDateFromUTC 转换
    return formatDateFromUTC(value)
  }

  getCreatedAtAttribute(value: string | Date) {
    return formatDateFromUTC(value)
  }

  // ── $beforeInsert / $beforeUpdate ──────────────────────────────────────────

  /**
   * $beforeInsert — 插入前钩子
   *
   * 1. enum 枚举约束检查（可选字段有值时校验）
   * 2. 注入 createdAt / updatedAt 时间戳
   */
  $beforeInsert() {
    this.enforceEnums()
    if ((this.constructor as typeof BaseModel).useTimestamps) {
      const now = nowDate()
      Object.assign(this, { createdAt: now, updatedAt: now })
    }
  }

  /**
   * $beforeUpdate — 更新前钩子
   *
   * 1. enum 枚举约束检查
   * 2. 更新 updatedAt 时间戳
   *
   * ⚠️ 注意：这里仍然设置 updatedAt，因为 MySQL ON UPDATE 触发器
   *    依赖于字段被包含在 UPDATE 中才触发
   */
  $beforeUpdate() {
    this.enforceEnums()
    if ((this.constructor as typeof BaseModel).useTimestamps) {
      Object.assign(this, { updatedAt: nowDate() })
    }
  }

  /** 检查枚举约束（不在枚举内则抛出结构化错误） */
  enforceEnums() {
    const props = getSchemaProps(this.constructor as typeof BaseModel)
    if (!props) return
    for (const [key, prop] of Object.entries(props)) {
      if (!prop.enum) continue
      const val = (this as Record<string, unknown>)[key]
      if (val === undefined || val === null) continue
      const matchesEnum = prop.enum.some((e: string) => String(e) === String(val) || Number(e) === Number(val))
      if (!matchesEnum) {
        const err = new Error(`字段 "${key}" 值 "${val}" 不在允许的枚举值内：[${prop.enum.join(', ')}]`) as AppError
        err.code = 'ENUM_VIOLATION'
        err.field = key
        throw err
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // §3  静态写操作辅助（insert / modify 前的预处理流水线）
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * coerceSchemaTypes — 在进入 Objection 前将 string 强制转为 number/integer/boolean
   *
   * 这是对 $beforeValidate / $parseJson 的"前置保险"：
   * 确保通过 BaseModel.insert / modifyById / modifyByFilters 封装方法写入时，
   * 数据在进入 Objection 之前已经是正确类型，Ajv 一定能通过。
   */
  static coerceSchemaTypes(data: Record<string, any>): Record<string, any> {
    const props = getSchemaProps(this)
    if (!props) return data
    const result = { ...data }
    for (const [key, prop] of Object.entries(props)) {
      if (!(key in result)) continue
      result[key] = this.sanitizeValue(result[key], prop)
    }
    return result
  }

  /**
   * filterSchemaFields — 只保留 schema 中定义的字段
   *
   * 用于 update/patch 场景，防止关联表字段（packagings, gradesPrices 等）
   * 被当作主表列写入导致 SQL 语法错误。
   */
  static filterSchemaFields(data: Record<string, any>): Record<string, any> {
    if (!data || typeof data !== 'object') return {}

    const props = this.jsonSchema?.properties as unknown as SchemaProps | undefined
    if (props) {
      return Object.fromEntries(Object.entries(data).filter(([key]) => key in props))
    }

    if (this.inserTable?.length) {
      return Object.fromEntries(Object.entries(data).filter(([key]) => this.inserTable.includes(key)))
    }

    // 无 schema、无 inserTable → 透传全部字段
    return { ...data }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // §4  实例辅助（访问器 / 修改器 / casts）
  // ══════════════════════════════════════════════════════════════════════════

  protected static runAccessors(data: Record<string, any>): Record<string, any> {
    const proto = this.prototype
    const methods = Object.getOwnPropertyNames(this).concat(Object.getOwnPropertyNames(proto))
    const staticCtx = this as unknown as Record<string, (val: unknown) => unknown>
    methods.forEach((method) => {
      if (method.startsWith('get') && method.endsWith('Attribute')) {
        const field = _.snakeCase(method.replace('get', '').replace('Attribute', ''))
        if (data[field] !== undefined && typeof staticCtx[method] === 'function') {
          data[field] = staticCtx[method](data[field])
        }
      }
    })
    return data
  }

  protected static runMutators(data: Record<string, any>): Record<string, any> {
    const staticCtx = this as unknown as Record<string, unknown>
    for (const key in data) {
      const methodName = `set${_.upperFirst(_.camelCase(key))}Attribute`
      const mutator = staticCtx[methodName]
      if (typeof mutator === 'function') {
        data[key] = (mutator as (val: unknown) => unknown)(data[key])
      }
    }
    return data
  }

  protected static runCasts(data: Record<string, any>, type: 'get' | 'set'): Record<string, any> {
    const result = { ...data }
    for (const key in this.casts) {
      const caster = this.casts[key]
      if (result[key] !== undefined && typeof caster !== 'string') {
        result[key] = type === 'get' ? caster.get(result[key]) : caster.set(result[key])
      }
    }
    return result
  }

  // ══════════════════════════════════════════════════════════════════════════
  // §5  Knex / Objection 基础配置
  // ══════════════════════════════════════════════════════════════════════════
  static columnNameMappers = snakeCaseMappers()
  // static get columnNameMappers() {
  //   return snakeCaseMappers();
  // }

  static get createdAtColumn() {
    return 'createdAt'
  }

  static get updatedAtColumn() {
    return 'updatedAt'
  }

  /**
   * 获取 jsonSchema 属性对应的数据库列名（经 columnNameMappers 映射为 snake_case）。
   * 统一收敛到 BaseModel，消除各子类重复定义；未映射时原样返回属性名。
   */
  static getSchemaDbColumns(): string[] {
    const props = Object.keys(this.jsonSchema?.properties ?? {})
    const mapper = this.columnNameMappers
    if (!mapper?.format) return props
    return props.map((prop: string) => {
      const mapped = mapper.format({ [prop]: null })
      return Object.keys(mapped)[0]
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // §6  排序
  // ══════════════════════════════════════════════════════════════════════════

  static applyOrder<T extends BaseModel>(query: QueryBuilder<T>, order?: SortOrder): QueryBuilder<T> {
    const normalized: Array<{ column: string; order: 'ASC' | 'DESC' }> = []

    if (Array.isArray(order)) {
      for (const item of order) {
        if (!item || typeof item.column !== 'string' || item.column.trim() === '') continue
        normalized.push({
          column: item.column,
          order: item.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
        })
      }
    } else if (order && typeof order === 'object' && 'column' in order && typeof order.column === 'string') {
      const column = order.column
      if (column.trim() !== '') {
        normalized.push({
          column,
          order: order.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
        })
      }
    }

    const hasSortField = this.jsonSchema?.properties && Object.keys(this.jsonSchema.properties).includes('sort')

    if (hasSortField) {
      query.orderByRaw('CASE WHEN ??.?? > 0 THEN 1 ELSE 0 END DESC', [this.tableName, 'sort'])
      const callerHasSort = normalized.some((v) => v.column === 'sort' || v.column.endsWith('.sort'))
      if (!callerHasSort) {
        query.orderByRaw('??.?? ASC', [this.tableName, 'sort'])
      }
    }

    // ── 排序列白名单校验（防越权排序列 / 排序列注入）────────────────────────
    const sortableColumns = this.getSortableColumns()
    const safeOrder =
      sortableColumns.size > 0 ? normalized.filter((item) => this.isSortableColumn(item.column, sortableColumns)) : normalized

    if (safeOrder.length > 0) {
      for (const item of safeOrder) {
        query.orderBy(item.column, item.order.toLowerCase() as 'asc' | 'desc')
      }
      return query
    }

    if (!hasSortField) {
      query.orderBy('id', 'asc')
    }
    return query
  }

  /**
   * 获取允许排序的列白名单（基于 jsonSchema.properties）。
   * 同时纳入 camelCase 属性名与经 columnNameMappers 映射后的 snake_case 数据库列名，
   * 以兼容 Service 层传入的两种命名方式。
   */
  protected static getSortableColumns(): Set<string> {
    const props = Object.keys(this.jsonSchema?.properties ?? {})
    const columns = new Set<string>(props)
    const mapper = this.columnNameMappers
    if (mapper && typeof mapper.format === 'function') {
      for (const prop of props) {
        try {
          const mapped = Object.keys(mapper.format({ [prop]: null }))[0]
          if (mapped) columns.add(mapped)
        } catch {
          // 单字段映射失败不影响整体白名单
        }
      }
    }
    return columns
  }

  /**
   * 判断某个排序列是否命中白名单。
   * 支持「表名.列名」前缀形式（JOIN 场景）；前缀本身由 Knex 作为标识符转义，不参与白名单判定。
   */
  protected static isSortableColumn(column: string, sortableColumns: Set<string>): boolean {
    if (sortableColumns.has(column)) return true
    const dotIdx = column.lastIndexOf('.')
    if (dotIdx > 0) {
      return sortableColumns.has(column.slice(dotIdx + 1))
    }
    return false
  }

  // ══════════════════════════════════════════════════════════════════════════
  // §7  查询方法
  // ══════════════════════════════════════════════════════════════════════════

  static buildQuery(
    query: QueryBuilder<BaseModel> = this.query(),
    _filters: Record<string, any> | undefined = {},
    _trashed: boolean = false
  ): QueryBuilder<BaseModel> {
    if (config('app.debugger') === true) {
      console.debug('[SQL]', query.toKnexQuery().toSQL().toNative())
    }

    // ── 通用兜底过滤（仅当子类未覆盖 buildQuery 时生效）────────────────────
    // 目的：避免新 Model 忘记覆盖 buildQuery 时 filters 被静默丢弃，
    // 至少保证「软删除过滤」与「通用 id 过滤」两条基础契约不被破坏。
    // 已覆盖 buildQuery 的 74 个子类均为完整重写、不调用本基类，故不受影响。
    const table = this.tableName

    // 1) 软删除过滤
    if (this.softDelete === true) {
      const col = this.softDeleteColumn || 'deleted_at'
      if (_trashed) {
        query.whereNotNull(`${table}.${col}`)
      } else {
        query.whereNull(`${table}.${col}`)
      }
    }

    // 2) 通用 id 过滤（支持标量 / 数组 / { eq, not }）
    const filters = _filters || {}
    if (filters && typeof filters === 'object') {
      const id = filters.id
      if (id !== undefined && id !== null) {
        const apply = (field: string, value: FilterValue, isNot: boolean = false) => {
          const isArr = Array.isArray(value)
          if (isNot) {
            isArr ? query.whereNotIn(field, value) : query.whereNot(field, value)
          } else {
            isArr ? query.whereIn(field, value) : query.where(field, value)
          }
        }
        if (typeof id === 'object' && !Array.isArray(id)) {
          if (id.eq !== undefined) apply(`${table}.id`, id.eq)
          if (id.not !== undefined) apply(`${table}.id`, id.not, true)
        } else {
          apply(`${table}.id`, id)
        }
      }
    }

    return query
  }

  static async findById<T extends typeof BaseModel>(this: T, id: number): Promise<InstanceType<T> | undefined> {
    // Objection QueryBuilder 泛型无法在静态方法中自动绑定到 T，此处单点收敛转换
    return (await this.query().findById(id)) as unknown as InstanceType<T> | undefined
  }

  /**
   * 通用筛选器类型：
   *  - Record<string, any> 兼容 Service 层以 Parameters<...buildQuery>[1] 推导的匿名对象类型
   *  - undefined 兼容 Service 层「未传筛选器」的可选参数语义（运行时由各 buildQuery 默认 {} 兜底）
   */
  static async findOne<T extends typeof BaseModel>(
    this: T,
    filters: Record<string, any> | undefined = {},
    trashed: boolean = false
  ): Promise<InstanceType<T> | undefined> {
    const query = this.buildQuery(this.query(), filters, trashed)
    // Objection QueryBuilder 泛型无法在静态方法中自动绑定到 T，此处单点收敛转换
    return (await query.first()) as unknown as InstanceType<T> | undefined
  }

  static async findAll<T extends typeof BaseModel>(
    this: T,
    filters: Record<string, any> | undefined = {},
    options: {
      order?: SortOrder
    } = {},
    trashed: boolean = false
  ) {
    const { order } = options
    const baseQuery = this.buildQuery(this.query(), filters, trashed)
    this.applyOrder(baseQuery, order)
    // Objection QueryBuilder 泛型无法在静态方法中自动绑定到 T，此处单点收敛转换
    return (await baseQuery) as unknown as InstanceType<T>[]
  }

  static async findMany<T extends typeof BaseModel>(
    this: T,
    filters: Record<string, any> | undefined = {},
    options: {
      page?: number
      pageSize?: number
      order?: SortOrder | undefined
    } = {},
    trashed: boolean = false
  ) {
    const { page = 1, pageSize = 10, order } = options
    const offset = (page - 1) * pageSize
    const baseQuery = this.buildQuery(this.query(), filters, trashed)
    const countQuery = baseQuery.clone()
    const dataQuery = baseQuery.clone()
    const total = await countQuery.resultSize()
    this.applyOrder(dataQuery, order)
    // Objection QueryBuilder 泛型无法在静态方法中自动绑定到 T，此处单点收敛转换
    const data = (await dataQuery.limit(pageSize).offset(offset)) as unknown as InstanceType<T>[]
    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // §8  写操作（insert / modify / delete）
  //     流水线：undefined→null → filterSchemaFields → runMutators
  //             → runCasts(set) → coerceSchemaTypes → Objection
  // ══════════════════════════════════════════════════════════════════════════

  /** 预处理流水线（insert / modify 公共逻辑） */
  protected static prepareData(data: Record<string, any>, opts: { filter?: boolean } = {}): Record<string, any> {
    // 0. undefined → null
    let d: Record<string, any> = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === undefined ? null : v]))
    // 1. 字段白名单过滤（update 场景需要）
    if (opts.filter) {
      const filtered = this.filterSchemaFields(d)
      if (!filtered || Object.keys(filtered).length === 0) return {}
      d = filtered
    }
    // 2. Mutators
    d = this.runMutators(d)
    // 3. Casts（set）
    d = this.runCasts(d, 'set')
    // 4. 类型强制转换（string → number / integer / boolean）
    d = this.coerceSchemaTypes(d)
    return d
  }

  static async insert<T extends typeof BaseModel>(this: T, data: Partial<InstanceType<T>> | Record<string, any>) {
    let d = (this as typeof BaseModel).prepareData(data as Record<string, any>)
    // inserTable 白名单（额外过滤，兼容旧逻辑）
    if (this.inserTable.length) {
      const filtered = Object.fromEntries(Object.entries(d).filter(([key]) => this.inserTable.includes(key)))
      if (Object.keys(filtered).length === 0) {
        const err = new Error(`No valid fields to insert for table ${this.tableName}.`) as AppError
        err.code = 'BaseModel:insert:emptyFields'
        throw err
      }
      d = filtered
    }
    const inserted = (await this.query().insertAndFetch(d)) as InstanceType<T>
    let json: Pojo = inserted.toJSON()
    json = (this as typeof BaseModel).runAccessors(json)
    json = (this as typeof BaseModel).runCasts(json, 'get')
    return Object.assign(Object.create(this.prototype), json)
  }

  static async insertMany<T extends typeof BaseModel>(this: T, data: Array<Partial<InstanceType<T>> | Record<string, any>>) {
    if (data.length === 0) return []
    const inserted: Array<InstanceType<T>> = []
    await this.transaction(async (trx) => {
      for (const item of data) {
        let d = (this as typeof BaseModel).prepareData(item as Record<string, any>)
        if (this.inserTable.length) {
          const filtered = Object.fromEntries(Object.entries(d).filter(([key]) => this.inserTable.includes(key)))
          if (Object.keys(filtered).length > 0) d = filtered
        }
        const result = await this.query(trx).insert(d)
        inserted.push(result as InstanceType<T>)
      }
    })
    return inserted
  }

  static async modifyById<T extends typeof BaseModel>(
    this: T,
    id: number,
    data: Partial<InstanceType<T>>
  ): Promise<InstanceType<T> | null> {
    const d = (this as typeof BaseModel).prepareData(data as Record<string, any>, { filter: true })
    // 移除 id 字段，patch 不需要更新主键
    const { id: _, ...patchData } = d
    if (Object.keys(patchData).length === 0) return null
    return (await this.query().patchAndFetchById(id, patchData)) as unknown as InstanceType<T> | null
  }

  static async modifyByFilters<T extends typeof BaseModel>(
    this: T,
    filters: Record<string, any> | undefined = {},
    data: Partial<InstanceType<T>>
  ) {
    // 空 filter 会导致全表改状态，必须拒绝
    this.assertNonEmptyFilter(filters, 'modifyByFilters')
    const d = (this as typeof BaseModel).prepareData(data as Record<string, any>, { filter: true }) as Partial<InstanceType<T>>
    if (Object.keys(d).length === 0) return 0
    // 批量 patch 不触发 $beforeUpdate，手动补 updatedAt
    if ((this as typeof BaseModel).useTimestamps) {
      Object.assign(d, { updatedAt: nowDate() })
    }
    const query = this.buildQuery(this.query(), filters)
    return await query.patch(d)
  }

  static async restoreById(id: number) {
    if (this.softDelete) {
      return await this.query()
        .where('id', id)
        .patch({ [this.softDeleteColumn]: null })
    }
    return null
  }

  static async restoreByFilters<T extends typeof BaseModel>(this: T, filters: Record<string, any> | undefined = {}) {
    const query = this.buildQuery(this.query(), filters)
    if (this.softDelete) {
      return await query.patch({ [this.softDeleteColumn]: null })
    }
    return null
  }

  static async deleteById(id: number) {
    if (this.softDelete) {
      return await this.query()
        .where('id', id)
        .patch({ [this.softDeleteColumn]: nowDate() })
    }
    return await this.query().deleteById(id)
  }

  static async deleteByFilters<T extends typeof BaseModel>(this: T, filters: Record<string, any> | undefined = {}) {
    // 空 filter 不生成 WHERE 会导致全表操作，必须拒绝
    this.assertNonEmptyFilter(filters, 'deleteByFilters')
    const query = this.buildQuery(this.query(), filters)
    if (this.softDelete) {
      return await query.patch({ [this.softDeleteColumn]: nowDate() })
    }
    return await query.delete()
  }

  static async forceDelete<T extends typeof BaseModel>(this: T, filters: Record<string, any> | undefined = {}) {
    if (this.softDelete === true) {
      const query = this.buildQuery(this.query(), filters, true)
      const count = await query.resultSize()
      if (count === 0) {
        const err = new Error(
          `No soft-deleted record found matching the given filters — ` +
            `force delete requires the record to be soft-deleted first. ` +
            `Table: ${this.tableName}`
        ) as AppError
        err.code = 'BaseModel:forceDelete:notSoftDeleted'
        throw err
      }
      return await query.delete()
    }
    const query = this.buildQuery(this.query(), filters)
    return await query.delete()
  }

  /**
   * P0 修复（审计 2026-08-18）：批量操作（删除/改状态）拒绝空 filter，
   * 防止 {"filter":{}} 触发全表删除或全表启停
   */
  static assertNonEmptyFilter<T extends typeof BaseModel>(this: T, filters: Record<string, any> | undefined, method: string): void {
    if (!filters || typeof filters !== 'object' || Object.keys(filters).length === 0) {
      const err = new Error(
        `${method} requires a non-empty filter — refusing batch operation on the whole table. ` + `Table: ${this.tableName}`
      ) as AppError
      err.code = 'BaseModel:batchOp:emptyFilter'
      throw err
    }
  }
}
