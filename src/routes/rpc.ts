/*
 * @Author: trexwb
 * @Date: 2026-02-05 16:58:57
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 10:45:59
 * @FilePath: /node-laravel/src/routes/rpc.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import path from 'node:path';
import { Router } from 'express';
import { loadDynamicRoutes } from '#bootstrap/routeLoader';
import { authenticateSecret } from '#app/Http/Middleware/AuthenticateSecret';
// import { verifySignature } from '#app/Http/Middleware/VerifySignature';
import { decryptRequest } from '#app/Http/Middleware/DecryptRequest';
import { encryptResponse } from '#app/Http/Middleware/EncryptResponse';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// 存储动态加载的方法
let rpcMethods: Record<string, any> = {};

async function initRpc() {
  const rpcsDir = path.join(__dirname, 'rpcs');
  rpcMethods = await loadDynamicRoutes(rpcsDir);
}

// 执行加载
initRpc();
/**
 * JSON-RPC 统一入口
 * 复用现有的签名、认证、响应加密中间件
 */
router.post('/', [authenticateSecret, decryptRequest, encryptResponse], async (req: any, res: any) => {
  const { method, params } = req.body;
  // 1. 基础规范校验
  if (!method) {
    res.error({
      error: { code: -32600, message: 'Invalid JSON-RPC request' }
    });
    return;
  }
  // 2. 寻找对应的 RPC 方法 (替代了传统 API 的路由匹配)
  const handler = rpcMethods[method];
  if (!handler) {
    res.error({
      error: { code: -32601, message: `Method [${method}] not found` }
    });
    return;
  }
  try {
    // 3. 执行方法 (就像 Controller 里的 action)
    // 我们可以通过 ctx 传入 req 里的用户信息
    const result = await handler(params, (req as any).secretRow);
    // 4. 返回符合规范的 Result
    res.success(result);
  } catch (err: any) {
    res.error({ code: -32603, message: err.message || 'Internal error' });
  }
});

export default router;