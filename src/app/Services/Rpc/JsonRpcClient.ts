/*
 * @Author: trexwb
 * @Date: 2026-02-05 15:03:20
 * @LastEditors: ${git_name}
 * @LastEditTime: 2026-03-29 08:13:23
 * @FilePath: /stl-dev-server/server/src/app/Services/Rpc/JsonRpcClient.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { CircuitBreaker } from '#app/Services/Rpc/CircuitBreaker'
import type { RpcResponse, RpcServerConfig } from '#types/rpc'
import { CryptoTool } from '#utils/cryptoTool'
export type { RpcServerConfig } from '#types/rpc'

// 定义响应数据的类型

/** RPC 服务器连接配置（对应 ServersModel 的 url/appId/appSecret/appIv 字段） */

export class JsonRpcClient {
  private url: string
  private appId: number
  private appSecret: string
  private breaker = new CircuitBreaker()
  private appIv: string

  /**
   * 初始化 JSON-RPC 客户端实例。
   * @param {any} serverConfig - 服务器配置对象，需包含 url、appId、appSecret、appIv
   */
  constructor(serverConfig: RpcServerConfig) {
    this.url = serverConfig.url
    this.appId = serverConfig.appId
    this.appSecret = serverConfig.appSecret
    this.appIv = serverConfig.appIv
  }

  /**
   * 生成符合要求的动态签名。
   * 签名算法：sha256(appId+timestamp) 得到 appStr，再 md5(appStr+appSecret)+timestamp。
   * @returns {string} 签名字符串
   */
  private generateSignature() {
    const timeStampStr = Math.floor(Date.now() / 1000).toString()
    const appStr = CryptoTool.sha256(`${this.appId}${timeStampStr}`)
    const expectedSecret = CryptoTool.md5(`${appStr}${this.appSecret}`) + timeStampStr
    return expectedSecret
  }

  /**
   * 发起 RPC 调用（使用 fetch）。
   * @param {string} method - RPC 方法名
   * @param {any} [params={}] - 调用参数
   * @returns {Promise<any|{code: number, msg: string}|false>} 返回数据对象；若响应码非 200 返回 {code, msg}；网络异常返回 false
   * @throws {Error} 当请求失败或响应类型不正确时抛出
   */
  private async transport(method: string, params: unknown = {}) {
    const payload = {
      method,
      params,
    }
    try {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: {
          'App-Id': String(this.appId),
          'App-Secret': this.generateSignature(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (!res) {
        throw new Error('Request failed')
      }
      const json = await res.json()
      const rpcResponse = json as RpcResponse
      if (!rpcResponse || typeof rpcResponse !== 'object') {
        throw new Error('Request type failed')
      }
      if (!rpcResponse.code || rpcResponse.code !== 200) {
        return { code: rpcResponse.code, msg: rpcResponse.msg }
      }
      let data: unknown = rpcResponse.data || {}
      if (rpcResponse.encryptedData) {
        data = CryptoTool.decrypt(rpcResponse.encryptedData, this.appSecret, this.appIv)
      }
      return data
    } catch (err) {
      return false
    }
  }

  /**
   * 创建一个带超时的 Promise 包装器。
   * @param {Promise<T>} promise - 原始 Promise
   * @param {number} ms - 超时时间（毫秒）
   * @returns {Promise<T>} 在指定时间后自动 reject 的 Promise
   * @throws {Error} 超时后抛出 "Timeout" 错误
   */
  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
    return Promise.race([promise, timeout])
  }

  /**
   * 重试执行一个异步函数，直到成功或者达到最大重试次数。
   * 采用指数退避策略：baseDelay * 2^i。
   * @param {() => Promise<T>} fn - 要执行的异步函数
   * @param {{retries?: number, baseDelay?: number}} [options] - 重试选项，默认 {retries: 3, baseDelay: 100}
   * @returns {Promise<T>} 函数执行结果
   * @throws {Error} 达到最大重试次数后抛出最后一次错误
   */
  async retry<T>(
    fn: () => Promise<T>,
    options = {
      retries: 3,
      baseDelay: 100,
    }
  ): Promise<T> {
    let lastError
    for (let i = 0; i <= options.retries; i++) {
      try {
        return await fn()
      } catch (err) {
        lastError = err
        if (i === options.retries) break
        const delay = options.baseDelay * Math.pow(2, i)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
    throw lastError
  }

  /**
   * 执行 RPC 调用（集成熔断器、重试和超时机制）。
   * @param {string} method - RPC 方法名
   * @param {any} params - 调用参数
   * @returns {Promise<any>} RPC 调用结果
   * @throws {Error} 当熔断器打开、超时或重试耗尽时抛出
   */
  async call(method: string, params: unknown) {
    return this.breaker.execute(() => this.retry(() => this.withTimeout(this.transport(method, params), 3000)))
  }
}
