/*
 * @Author: trexwb
 * @Date: 2026-02-05 15:03:20
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:53:51
 * @FilePath: /node-laravel/src/app/Services/Rpc/JsonRpcClient.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import { Crypto } from '#utils/Crypto';
import { CircuitBreaker } from '#app/Services/Rpc/CircuitBreaker';

// 定义响应数据的类型
interface RpcResponse {
  code: number;
  msg?: string;
  data?: any;
  encryptedData?: string;
}

export class JsonRpcClient {
  private url: string;
  private appId: string;
  private appSecret: string;
  private breaker = new CircuitBreaker();
  private appIv: string;

  constructor(serverConfig: any) {
    this.url = serverConfig.url;
    this.appId = serverConfig.appId;
    this.appSecret = serverConfig.appSecret;
    this.appIv = serverConfig.appIv;
  }

  /**
   * 生成符合你要求的动态签名
   */
  private generateSignature() {
    const timeStampStr = Math.floor(Date.now() / 1000).toString();
    const appStr = Crypto.sha256(`${this.appId}${timeStampStr}`);
    const expectedSecret = Crypto.md5(`${appStr}${this.appSecret}`) + timeStampStr;
    return expectedSecret;
  }

  /**
   * 发起 RPC 调用（使用 fetch）
   */
  private async transport(method: string, params: any = {}) {
    const payload = {
      method,
      params
    };
    try {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: {
          'App-Id': this.appId,
          'App-Secret': this.generateSignature(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res) {
        throw new Error('Request failed');
      }
      const json = await res.json();
      const rpcResponse = json as RpcResponse;
      if (!rpcResponse || typeof rpcResponse !== 'object') {
        throw new Error('Request type failed');
      }
      if (!rpcResponse.code || rpcResponse.code !== 200) {
        return { code: rpcResponse.code, msg: rpcResponse.msg };
      }
      let data = rpcResponse.data || {};
      if (rpcResponse.encryptedData) {
        data = Crypto.decrypt(rpcResponse.encryptedData, this.appSecret, this.appIv);
      }
      return data;
    } catch (err) {
      return false;
    }
  }

  /*
   * 创建一个 Promise，在指定时间后自动 reject
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    ms: number
  ): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    );
    return Promise.race([promise, timeout]);
  }

  /**
   * 重试执行一个异步函数，直到成功或者达到最大重试次数
   */
  async retry<T>(
    fn: () => Promise<T>,
    options = {
      retries: 3,
      baseDelay: 100
    }
  ): Promise<T> {
    let lastError;
    for (let i = 0; i <= options.retries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (i === options.retries) break;
        const delay = options.baseDelay * Math.pow(2, i);
        await new Promise(r =>
          setTimeout(r, delay)
        );
      }
    }
    throw lastError;
  }

  async call(method: string, params: any) {
    return this.breaker.execute(() =>
      this.retry(() =>
        this.withTimeout(
          this.transport(method, params),
          3000
        )
      )
    );
  }
}
