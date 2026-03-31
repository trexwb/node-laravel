/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-03-27 11:30:00
 * @FilePath: /node-laravel/src/app/Providers/AppServiceProvider.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */
import { WriteLogsEvents } from '#app/Events/WriteLogsEvents';
import { logger } from '#utils/Logger';

export class AppServiceProvider {
  private static booted = false;

  /**
   * 启动所有应用服务
   * 保证只执行一次（防止热重载时重复注册监听器）
   */
  public static boot() {
    if (this.booted) return;
    this.booted = true;

    // 注册所有事件监听器
    WriteLogsEvents.listen();

    logger.info('[Provider] AppServiceProvider 已加载');
  }
}
