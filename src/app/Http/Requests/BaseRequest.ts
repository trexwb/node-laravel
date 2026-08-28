/*
 * @Author: trexwb
 * @Date: 2026-01-29
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-15 17:30
 * @FilePath: node-laravel/src/app/Http/Requests/BaseRequest.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { Request } from 'express'
import type { Model } from 'objection'
import Validator from 'validatorjs'

Validator.register('nullable', () => true)

// object: validatorjs 没有内置 object 类型校验，注册为 pass-through
// 实际类型由 Objection.js 的 jsonSchema 负责校验
Validator.register('object', () => true)

// optional: validatorjs 无 required 即为可选，注册为 pass-through 兼容写法
Validator.register('optional', () => true)

// ═══════════════════════════════════════════════════════════════════════════
// unique 验证器（统一注册，模型无关）
// 用法：unique:columnName,exceptId::ModelClass
// 示例：unique:skuCode,0::GoodsModel
// 注意：使用 :: 作为 Model 参数锚点，避免被 validatorjs 当作 | 规则分隔符解析
// ═══════════════════════════════════════════════════════════════════════════
Validator.registerAsync(
  'unique',
  async (value, args, _attribute, passes) => {
    const [argPart, modelClassName] = args.split('::')
    const [column, exceptId] = argPart.split(',')

    if (!modelClassName) {
      passes(false, 'unique 规则缺少 ModelClass 参数（格式：unique:col,id::ModelClass）')
      return
    }

    // snake_case 转换（snakeCaseMappers 只在 Model 层生效，raw where 必须手动转换）
    const dbColumn = column.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)

    // 动态获取 Model 类（通过 global 查找）
    const ModelClass = (globalThis as unknown as Record<string, typeof Model | undefined>)[modelClassName]
    if (!ModelClass || typeof ModelClass.query !== 'function') {
      passes(false, `Model "${modelClassName}" not found`)
      return
    }

    let query = ModelClass.query().where(dbColumn, value)
    if (exceptId && Number(exceptId) > 0) {
      query = query.whereNot('id', exceptId)
    }
    const exists = await query.first()
    exists ? passes(false) : passes()
  },
  '该值已存在'
)

// ═══════════════════════════════════════════════════════════════════════════
// uniqueComposite 验证器（复合唯一，模型无关）
// 用法：uniqueComposite:enumType,exceptId::EnumsModel
// 示例：uniqueComposite:enumType,0::EnumsModel
// 检查 enum_type + enum_key 联合唯一
// 注意：使用 :: 作为 Model 参数锚点
// ═══════════════════════════════════════════════════════════════════════════
Validator.registerAsync(
  'uniqueComposite',
  async (value, args, _attribute, passes) => {
    const [argPart, modelClassName] = args.split('::')
    const [enumType, exceptId] = argPart.split(',')

    if (!modelClassName) {
      passes(false, 'uniqueComposite 规则缺少 ModelClass 参数（格式：uniqueComposite:col,id::ModelClass）')
      return
    }

    const ModelClass = (globalThis as unknown as Record<string, typeof Model | undefined>)[modelClassName]
    if (!ModelClass || typeof ModelClass.query !== 'function') {
      passes(false, `Model "${modelClassName}" not found`)
      return
    }

    const dbEnumType = enumType.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
    let query = ModelClass.query().where('enum_type', dbEnumType).where('enum_key', value)
    if (exceptId && Number(exceptId) > 0) {
      query = query.whereNot('id', exceptId)
    }
    const exists = await query.first()
    exists ? passes(false) : passes()
  },
  '该枚举类型下已存在相同的键名'
)

export abstract class BaseRequest {
  protected req: Request

  constructor(req: Request) {
    this.req = req
  }

  /** 子类必须实现（validatorjs 规则串，值为 'required|integer' 等） */
  abstract rules(): Record<string, string>

  /** 可选 */
  messages(): Record<string, string> {
    return {}
  }

  /** 是否有权限 */
  authorize(): boolean {
    return true
  }

  /**
   * 🔧 数据预处理钩子（子类可覆盖）
   * 默认行为：将 body 中疑似 JSON 字符串的字段自动解析为对象/数组
   * 解决 Form-data 场景：数组/对象被序列化为字符串的问题
   */
  prepareForValidation(): void {
    this.parseJsonFields(this.req.body)
  }

  /**
   * 递归解析 body 中值为 JSON 字符串的字段
   * 检测以 [ 或 { 开头的字符串，尝试 JSON.parse()
   */
  private parseJsonFields(obj: Record<string, unknown>, depth = 0): void {
    if (depth > 10) return // 防止递归过深
    if (!obj || typeof obj !== 'object') return

    for (const key of Object.keys(obj)) {
      const val = obj[key]
      if (typeof val === 'string') {
        const trimmed = val.trim()
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try {
            obj[key] = JSON.parse(trimmed)
          } catch {
            // 非合法 JSON，保持原字符串，validation 会报错
          }
        }
      } else if (typeof val === 'object' && val !== null) {
        this.parseJsonFields(val as Record<string, unknown>, depth + 1)
      }
    }
  }

  /**
   * 展开 wildcard 规则（packagings.*.unitCode）并逐个验证
   * 解决 validatorjs 原生不支持 array wildcard 展开的问题
   */
  private expandWildcardRules(data: Record<string, unknown>, rules: Record<string, string>): Record<string, string[]> {
    const allErrors: Record<string, string[]> = {}

    for (const ruleKey of Object.keys(rules)) {
      if (!ruleKey.includes('.*.')) continue // 只处理 wildcard 规则

      const parts = ruleKey.split('.')
      const arrayKey = parts[0] // packagings
      const fieldKey = parts[2] // unitCode
      const arrayValue = data[arrayKey]

      if (!Array.isArray(arrayValue)) continue

      for (let idx = 0; idx < arrayValue.length; idx++) {
        const item = arrayValue[idx]
        if (item == null) continue

        // 为每个元素创建独立验证器（只含当前字段）
        const itemValidator = new Validator({ [fieldKey]: item[fieldKey] }, { [fieldKey]: rules[ruleKey] })
        itemValidator.passes() // 同步验证
        const itemErrors = itemValidator.errors.all()

        if (Object.keys(itemErrors).length > 0) {
          // 错误格式与 validatorjs 一致：packagings[1].unitCode
          const attr = `${arrayKey}[${idx}].${fieldKey}`
          if (!allErrors[attr]) allErrors[attr] = []
          for (const msgs of Object.values(itemErrors)) {
            allErrors[attr].push(...msgs)
          }
        }
      }
    }

    return allErrors
  }

  /**
   * 从 rules 中提取所有需要返回的字段键
   * 支持从 wildcard 规则（packagings.*.unitCode）自动提取父级数组名（packagings）
   */
  private collectValidatedKeys(rules: Record<string, string>): string[] {
    const keys = new Set<string>()
    for (const key of Object.keys(rules)) {
      keys.add(key) // 顶层键

      const dotIdx = key.indexOf('.')
      if (dotIdx > 0) {
        const parent = key.slice(0, dotIdx) // packagings
        if (!keys.has(parent)) keys.add(parent) // 补充父级键
      }
    }
    return Array.from(keys)
  }

  /** 获取全部输入 */
  all() {
    return this.req.body
  }

  /** 获取单个字段 */
  input<T = unknown>(key: string, defaultValue?: T): T {
    return this.req.body?.[key] ?? defaultValue
  }

  /** 核心校验入口（Controller 只调用这个） */
  async validate<T extends Record<string, unknown> = Record<string, unknown>>(): Promise<T> {
    if (!this.authorize()) {
      throw new Error('无权操作')
    }

    // 🔥 预处理：将 JSON 字符串解析为对象/数组
    this.prepareForValidation()

    const data = this.all()
    const rules = this.rules()

    // 🔥 展开 wildcard 规则（packagings.*.unitCode）并逐个验证
    const wildcardErrors = this.expandWildcardRules(data, rules)

    const validator = new Validator(data, rules, this.messages())
    await this.registerAsyncRules()

    // 🔥 异步校验必须用 checkAsync
    await new Promise<void>((resolve, reject) => {
      validator.checkAsync(
        () => resolve(),
        () => reject({ ...validator.errors.all(), ...wildcardErrors })
      )
    })

    // ✅ 只保留 rules 中的字段（含父级数组名）
    const validated: Record<string, unknown> = {}
    for (const key of this.collectValidatedKeys(rules)) {
      if (key in data) {
        validated[key] = this.castValue(data[key], rules[key])
      }
    }
    return validated as T
  }

  private castValue(value: unknown, rule: string) {
    // 判断是否允许为空
    if (value === undefined || value === null) return value
    const rules = rule.split('|')
    if (rules.includes('integer')) return Number(value)
    if (rules.includes('numeric')) return Number(value)
    if (rules.includes('boolean')) return Boolean(value)
    if (rules.includes('string')) return String(value)
    return value // 默认不转换
  }
  /** 供子类覆盖：注册 async 规则 */
  protected async registerAsyncRules() {}
}
