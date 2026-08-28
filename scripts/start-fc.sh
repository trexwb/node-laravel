#!/bin/bash
# ===========================================
# 阿里云函数计算启动脚本
# HTTP 服务 + 队列 Worker 在同一进程内运行
# ===========================================

export START_QUEUE_WORKER=true
export FORCE_COLOR=0

echo "[Bootstrap] 启动 HTTP + Queue Worker (同进程模式)"
echo "[Bootstrap] PORT=${PORT:-3000}"

exec node ./src/public/index.js
