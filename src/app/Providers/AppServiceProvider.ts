/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: trexwb
 * @LastEditTime: 2026-04-01 13:44:52
 * @FilePath: node-laravel/src/app/Providers/AppServiceProvider.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { registerAllEvents } from '#app/Events/index'
import { createLogger } from '#app/Helpers/logger'

const log = createLogger('AppServiceProvider')

export class AppServiceProvider {
  /**
   * 启动所有应用服务
   */
  public static boot() {
    // 你也可以在这里初始化 Sharp 全局配置或自定义 Lodash 混入
    registerAllEvents()
    log.info('AppServiceProvider 已加载')
  }
}
