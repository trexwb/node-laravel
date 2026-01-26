import { WriteLogsEvents } from '#app/Events/WriteLogsEvents';

export class AppServiceProvider {
  /**
   * 启动所有应用服务
   */
  public static boot() {
    // 注册所有事件监听器
    WriteLogsEvents.listen();

    // 你也可以在这里初始化 Sharp 全局配置或自定义 Lodash 混入
    console.log('[Provider] AppServiceProvider 已加载');
  }
}