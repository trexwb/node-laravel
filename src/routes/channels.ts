/*
 * @Author: trexwb
 * @Date: 2026-01-29
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-05
 * @FilePath: node-laravel/src/routes/channels.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { ChannelController } from '#app/Http/Controllers/WebSocket/ChannelController'
import { WebSocketServer } from 'ws'

/**
 * 注册 WebSocket 频道逻辑
 */
export function registerChannels(wss: WebSocketServer) {
  ChannelController.handleConnection(wss)
}
