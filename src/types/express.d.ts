/**
 * @Author: trexwb
 * @Date: 2026-03-27 11:30:00
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/types/express.d.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 * 
 * Express 全局类型扩展声明
 * 在此处声明模块级别的类型扩展，所有引入 express 的文件均可自动获得类型提示
 */
import type { EventEmitter } from 'node:events';
import type { UsersModel } from '#app/Models/UsersModel';
import type { SecretsModel } from '#app/Models/SecretsModel';

// ============================================================
// Response 扩展 — 添加 Laravel 风格的快捷方法
// ============================================================
declare module 'express-serve-static-core' {
  interface Response {
    /**
     * 成功响应
     * @param data 响应数据
     * @param code 业务码（默认 200）
     */
    success(data?: any, code?: string | number): Response;

    /**
     * 错误响应
     * @param code 错误码
     * @param msg 错误信息
     */
    error(code?: string | number, msg?: string): Response;
  }
}

// ============================================================
// Request 扩展 — 添加业务常用字段
// ============================================================
declare module 'express-serve-static-core' {
  interface Request {
    /**
     * 请求唯一ID（用于全链路追踪）
     */
    id: string;

    /**
     * 已认证用户（经 AuthenticateToken 中间件注入）
     */
    currentUser?: UsersModel;

    /**
     * Token 解析后的 Payload
     */
    tokenPayload?: {
      token: string;
      timeStamp: number;
    };

    /**
     * 已验证的应用密钥信息（经 AuthenticateSecret 中间件注入）
     */
    secretRow?: SecretsModel;

    /**
     * 事件总线（启动时注入，供业务层发布/订阅事件）
     */
    eventEmitter?: EventEmitter;
  }
}
