/*
 * @Author: trexwb
 * @Date: 2026-03-27
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/types/express.d.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 *
 * Express 全局类型扩展声明（唯一入口）
 * 在此处声明模块级别的类型扩展，所有引入 express 的文件均可自动获得类型提示。
 * 框架版：secretRow/currentUser 等使用宽松/通用形状，业务方按需扩展字段。
 */
import type { TokenPayload } from '#types/utils'
import type { EventEmitter } from 'node:events'

// ============================================================
// Response 扩展 — 添加 Laravel 风格的快捷方法
// 运行时实现见 src/app/Http/Middleware/ResponseWrapper.ts（res.success / res.error）
// ============================================================
declare module 'express-serve-static-core' {
  interface Response {
    /**
     * 成功响应
     * @param data 响应数据
     * @param codeOrMsg 业务码（数字）或成功消息（字符串）
     * @param msg 业务码为数字时的消息
     */
    success(data?: unknown, codeOrMsg?: string | number, msg?: string): Response

    /**
     * 错误响应
     * @param code 错误码
     * @param msg 错误信息（可序列化的任意值，JSON 序列化后返回）
     */
    error(code?: string | number, msg?: unknown): Response
  }
}

// ============================================================
// AuthUser — req.currentUser 的类型（宽松形状）
// 运行时由业务方注入实际用户模型实例，框架层仅声明 Controller 消费的通用字段。
// ============================================================
export interface PermissionDetailPayload {
  key: string
  operation: string
}

export interface RolesPayload {
  id?: number
  name?: string
  permissions?: object
  status?: number
  permissionDetails?: PermissionDetailPayload[]
}

export interface AuthUser {
  id: number
  uuid: string
  nickname?: string | null
  truename?: string | null
  mobile?: string | null
  email?: string | null
  avatar?: string | null
  username?: string | null
  organizationId?: number | string | null
  status?: number
  rememberToken?: string | null
  roles?: RolesPayload[]
  gradeIds?: number[]
}

// ============================================================
// SecretRow — req.secretRow 的类型（宽松形状）
// 运行时由 AuthenticateSecret 中间件经 secretProvider 注入，
// 业务方按实际密钥表字段扩展。
// ============================================================
export interface SecretRow {
  appSecret?: string
  appId?: string | number
  appIv?: string
  [key: string]: unknown
}

// ============================================================
// Request 扩展 — 添加通用字段
// ============================================================
declare module 'express-serve-static-core' {
  interface Request {
    /**
     * 请求唯一ID（用于全链路追踪）
     */
    id: string

    /**
     * 已认证用户（经 AuthenticateToken 中间件注入，业务方定义实际形状）
     */
    currentUser?: AuthUser

    /**
     * Token 解密后的 Payload
     */
    tokenPayload?: TokenPayload

    /**
     * 已验证的应用密钥信息（经 AuthenticateSecret 中间件注入）
     */
    secretRow?: SecretRow

    /**
     * 原始请求体（供回调验签等场景使用，业务方自行捕获）
     */
    rawBodyBuffer?: Buffer

    /**
     * 事件总线（启动时注入，供业务层发布/订阅事件）
     */
    eventEmitter?: EventEmitter
  }
}
