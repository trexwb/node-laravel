/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/types/framework.d.ts
 * @Description:
 * 框架扩展点类型声明 — 框架层仅依赖本文件中的抽象接口，业务方通过 Container 注册对应实现完成注入。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { RpcServerConfig } from '#types/rpc'
import type { AuthUser } from '#types/express'

/** 应用密钥行（AuthenticateSecret 校验所需的字段子集） */
export interface SecretRow {
  id: number
  appId: number | string
  appSecret: string
  appIv?: string
  status?: number
  [key: string]: unknown
}

/** 密钥提供者：根据 appId 查询应用密钥（注入键：auth.secretProvider） */
export type SecretProvider = (appId: number | string) => Promise<SecretRow | null | undefined>

/** 令牌用户提供者：根据令牌中的 token 查询认证用户（注入键：auth.tokenUserProvider） */
export type TokenUserProvider = (token: string) => Promise<AuthUser | null | undefined>

/** 计划任务行（Kernel 依赖的最小字段子集） */
export interface ScheduledTaskRow {
  id: number | string
  name?: string
  time: string
  handler: object
  status: number
  [key: string]: unknown
}

/** 任务仓库：返回全部启用中的计划任务（注入键：schedule.taskRepository） */
export type TaskRepository = () => Promise<ScheduledTaskRow[]>

/** RPC 服务端配置提供者：根据 key 查询远端服务配置（注入键：rpc.serverConfigProvider） */
export type RpcServerConfigProvider = (key: string) => Promise<RpcServerConfig | null | undefined>

/** 队列任务行（QueueStore 返回的最小字段子集） */
export interface QueueJobRow {
  id: number | string
  queue?: string
  payload: unknown
  attempts: number
  reservedAt?: string | Date | null
  availableAt?: string | Date | null
  finishedAt?: string | Date | null
  [key: string]: unknown
}

/** 队列状态统计 */
export interface QueueStats {
  pending: number
  reserved: number
  completed: number
}

/** 队列存储抽象（数据库队列 Worker / artisan 依赖的存储接口，注入键：queue.store） */
export interface QueueStore {
  getNextAvailable(): Promise<QueueJobRow | null>
  releaseTimedOutJobs(timeoutSeconds?: number): Promise<number>
  insertJob(className: string, params: unknown, options?: { queue?: string; delay?: number }): Promise<QueueJobRow>
  markDone(id: number | string): Promise<unknown>
  markFailed(id: number | string, attempts: number, maxAttempts: number): Promise<unknown>
  getStats(): Promise<QueueStats>
}

/** WebSocket 频道处理器（ChannelController.register 注册） */
export interface ChannelMessageHandler {
  (ws: unknown, payload: unknown): void | Promise<void>
}

/** 日志落库器（WriteLogsListener 注入点） */
export interface LogSink {
  insert(entry: Record<string, unknown>): Promise<unknown>
}

/** 日志落库器注册表：根据 action 返回对应落库器（注入键：logs.sinkRegistry） */
export type LogSinkRegistry = (action: string) => LogSink | undefined

/** 计划任务执行器：调度触发时执行具体任务（注入键：schedule.taskExecutor，业务方包装自身 TaskRunner） */
export type TaskExecutor = (task: ScheduledTaskRow) => Promise<void>

/** Job 类构造器契约（与 #app/Interfaces/JobInstance 的 JobClass 保持一致） */
export type FrameworkJobClass = new (params: unknown) => { handle(): Promise<void> }

/** Job 类解析器：根据 className 返回对应 Job 构造器（注入键：queue.jobResolver） */
export type JobResolver = (className: string) => FrameworkJobClass | undefined

/** 开发环境 Mock Token 生成器（注入键：dev.mockTokenProvider，未注册时 mockToken 返回空） */
export type MockTokenProvider = () => Promise<unknown>

/** WebSocket 频道处理器映射（注入键：channel.handlers，key 为频道名如 'chat'） */
export type ChannelMessageHandlers = Record<string, ChannelMessageHandler>
