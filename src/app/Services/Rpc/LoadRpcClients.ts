/*
 * @Author: trexwb
 * @Date: 2026-02-05 15:49:49
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-09 14:53:57
 * @FilePath: /node-laravel/src/app/Services/Rpc/LoadRpcClients.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import { JsonRpcClient } from '#app/Services/Rpc/JsonRpcClient';
import { CacheService } from '#app/Services/Cache/CacheService';
import { ServersModel } from '#app/Models/ServersModel';

export function loadRpcClientsFromDB(key: string) {
  let clientPromise: Promise<JsonRpcClient> | null = null;

  const getClient = async () => {
    if (!clientPromise) {
      clientPromise = (async () => {
        const cacheKey = 'secrets';
        const row = await CacheService.remember(`${cacheKey}[key:${key}]`, 0, async () => ServersModel.findByKey(key));
        return new JsonRpcClient(row);
      })();
    }
    return clientPromise;
  };

  const proxy = new Proxy({}, {
    get(_target, propKey: string) {
      if (propKey === 'then' || propKey === 'catch' || propKey === 'finally') {
        return undefined;
      }
      return async (...args: any[]) => {
        const client = await getClient();
        const methodName = propKey.replace('_', '.');
        return client.call(methodName, args[0] || {});
      };
    },
  });
  return proxy;
}
