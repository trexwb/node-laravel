/*** 
 * @Author: trexwb
 * @Date: 2024-02-01 11:31:39
 * @LastEditors: ${git_name}
 * @LastEditTime: 2025-09-15 14:28:11
 * @FilePath: /web/server/src/route/front/index.js
 * @Description: 
 * @一花一世界，一叶一如来
 * @Copyright (c) 2024 by 杭州大美, All Rights Reserved. 
 */
'use strict';
import path from 'path';
import express from 'express';

const router = express.Router();

// 静态文件服务优化
const consoleDistPath = path.resolve(__dirname, '../../../../', './console/dist');
router.use('/', express.static(path.resolve(consoleDistPath, '')));

router.get('/{*splat}', (_req, res) => {
  res.status(200).sendFile(path.resolve(consoleDistPath, 'index.html'));
});

export default router;