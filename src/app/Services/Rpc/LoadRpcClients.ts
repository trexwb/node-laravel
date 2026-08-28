/*
 * @Author: trexwb
 * @Date: 2026-02-05
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/app/Services/Rpc/LoadRpcClients.ts
 * @Description:
 * 从配置提供者加载 RPC 客户端配置并返回代理对象。
 * 框架版：远端服务配置由业务方通过 Container 注册 rpc.serverConfigProvider 注入，不依赖业务 Model。
 * 支持懒加载客户端实例，并通过 Proxy 拦截方法调用转发给 RPC 服务。
 * @param {string} key - 服务器配置的唯一标识键
 * @returns {Proxy} 代理对象，动态调用 RPC 方法
 * @throws {Error} 当获取服务器配置或初始化客户端失败时抛出
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { Container } from '#app/Foundation/Container'
import { JsonRpcClient } from '#app/Services/Rpc/JsonRpcClient'
import type { RpcServerConfigProvider } from '#types/framework'

export function loadRpcClientsFromDB(key: string) {
  let clientPromise: Promise<JsonRpcClient> | null = null

  /**
   * 获取（懒加载）JsonRpcClient 实例。
   * 首次调用从注入的配置提供者读取服务器配置并创建客户端，后续复用同一个 Promise。
   * @returns {Promise<JsonRpcClient>} RPC 客户端实例
   * @throws {Error} 当读取配置或创建客户端失败时抛出
   */
  const getClient = async () => {
    if (!clientPromise) {
      clientPromise = (async () => {
        const provider = Container.resolve<RpcServerConfigProvider>('rpc.serverConfigProvider')
        const row = await provider(key)
        if (!row) throw new Error(`RPC server config not found for key: ${key}`)
        return new JsonRpcClient(row)
      })()
    }
    return clientPromise
  }

  const proxy = new Proxy(
    {},
    {
      get(_target, propKey: string) {
        if (propKey === 'then' || propKey === 'catch' || propKey === 'finally') {
          return undefined
        }
        return async (...args: unknown[]) => {
          const client = await getClient()
          const methodName = propKey.replace('_', '.')
          return client.call(methodName, args[0] || {})
        }
      },
    }
  )
  return proxy
}
