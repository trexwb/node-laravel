/**
 * RPC 域类型声明 — JSON-RPC 客户端与熔断器共用。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */

/** RPC 响应数据类型 */
export interface RpcResponse {
  code: number
  msg?: string
  data?: unknown
  encryptedData?: string
}

/** RPC 服务器连接配置（对应 ServersModel 的 url/appId/appSecret/appIv 字段） */
export interface RpcServerConfig {
  url: string
  appId: number
  appSecret: string
  appIv: string
}

/** 熔断器状态 */
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'
