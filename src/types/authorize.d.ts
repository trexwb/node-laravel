/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/types/authorize.d.ts
 * @Description:
 * 授权域类型声明。
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import type { bindWechatOpenidIfNeeded } from '#app/Helpers/WechatAuthorizeHelper'

/** bindWechatOpenidIfNeeded 的返回值类型（无显式导出，取推断结果） */
export type OpenidBindResult = Awaited<ReturnType<typeof bindWechatOpenidIfNeeded>>
