/*
 * @Author: trexwb
 * @Date: 2026-02-06 09:31:09
 * @LastEditors: trexwb
 * @LastEditTime: 2026-02-06 09:55:30
 * @FilePath: /ts/accounts/src/routes/rpcs/heartbeat.ts
 * @Description: 
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved. 
 */

export async function index(params: any, _secretRow?: any) {
  return {
    service: 'accounts',
    ...params
  };
}
