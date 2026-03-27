# 🚀 快速启动指南

## 环境要求
- Node.js >= 22.0.0
- npm >= 10.0.0
- MySQL >= 5.7 或 PostgreSQL >= 12
- Redis >= 6.0（生产环境推荐）

## 本地开发

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
```

编辑 `.env`，至少配置以下必填项：
```env
# 🔴 必填：安全密钥（生成方式见下文）
APP_KEY=<32位十六进制字符串>
APP_IV=<16位十六进制字符串>

# 数据库
DB_HOST=127.0.0.1
DB_DATABASE=node_laravel
DB_USER=root
DB_PASSWORD=

# 缓存（开发环境可用 file，生产环境必须 redis）
CACHE_DRIVER=file
```

### 3. 生成安全密钥
```bash
# macOS/Linux
openssl rand -hex 32   # 复制输出到 APP_KEY
openssl rand -hex 16   # 复制输出到 APP_IV

# Windows (PowerShell)
[System.Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
[System.Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(16))
```

### 4. 数据库迁移
```bash
npm run migrate:latest
npm run seed:run
```

### 5. 启动开发服务器
```bash
npm run dev
```

服务器将在 `http://localhost:80` 启动

---

## 生产部署

### 1. 构建
```bash
npm run build
```

### 2. 配置生产环境变量
```bash
cat > .env << EOF
APP_NAME=NodeLaravel
APP_ENV=production
APP_DEBUG=false
APP_KEY=<生成的32位密钥>
APP_IV=<生成的16位密钥>

# 数据库
DB_HOST=<生产数据库地址>
DB_DATABASE=node_laravel
DB_USER=<数据库用户>
DB_PASSWORD=<数据库密码>

# 缓存（必须 Redis）
CACHE_DRIVER=redis
CACHE_HOST=<Redis 地址>
CACHE_PORT=6379
CACHE_PASSWORD=<Redis 密码>

# 集群
CLUSTER_ENABLED=true
CLUSTER_WORKERS=auto

# HTTPS
SSL_ENABLED=true
SSL_KEY_PATH=/path/to/server.key
SSL_CERT_PATH=/path/to/server.crt
EOF
```

### 3. 启动应用
```bash
npm start
```

或使用 PM2：
```bash
npm install -g pm2
pm2 start dist/src/public/index.js --name "node-laravel" --instances max
pm2 save
pm2 startup
```

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式（热重载） |
| `npm run build` | 构建生产版本 |
| `npm start` | 启动生产服务器 |
| `npm run artisan:dev` | 开发模式运行命令行工具 |
| `npm run artisan -- queue:work` | 启动队列消费者 |
| `npm run artisan -- cache:clear` | 清除缓存 |
| `npm run migrate:latest` | 运行数据库迁移 |
| `npm run seed:run` | 运行数据库种子 |

---

## 健康检查

应用启动后，访问健康检查端点：
```bash
curl http://localhost/health
```

响应示例：
```json
{
  "status": "ok",
  "pid": 12345,
  "uptime": 3600,
  "timestamp": "2026-03-27T13:45:00.000Z"
}
```

---

## 日志查看

### 开发环境
日志输出到控制台，彩色格式：
```
[13:45:30] INFO  [req-uuid] --> GET /api/users
[13:45:31] DEBUG [req-uuid] SELECT * FROM users LIMIT 10
[13:45:31] INFO  [req-uuid] GET /api/users → 200 (45ms)
```

### 生产环境
日志输出为 JSON 格式（便于日志聚合）：
```json
{
  "timestamp": "2026-03-27T13:45:31.000Z",
  "level": "info",
  "pid": 12345,
  "message": "GET /api/users → 200 (45ms)"
}
```

---

## 故障排查

### 问题：APP_KEY 或 APP_IV 未配置
```
[FATAL] APP_KEY 环境变量未设置
```
**解决**: 在 `.env` 中配置 `APP_KEY` 和 `APP_IV`

### 问题：数据库连接失败
```
[Error] connect ECONNREFUSED 127.0.0.1:3306
```
**解决**: 检查数据库是否运行，确认 `DB_HOST`、`DB_USER`、`DB_PASSWORD` 正确

### 问题：Cluster 模式下缓存冲突
```
[Warn] File 驱动在 Cluster 生产环境中可能不安全
```
**解决**: 生产环境必须使用 Redis，设置 `CACHE_DRIVER=redis`

### 问题：WebSocket 连接失败
```
[Error] WebSocket 启动失败
```
**解决**: 检查 `WS_ENABLED=true` 和 `WS_PORT` 是否正确配置

---

## 性能优化建议

1. **启用 Cluster 模式**
   ```env
   CLUSTER_ENABLED=true
   CLUSTER_WORKERS=auto
   ```

2. **使用 Redis 缓存**
   ```env
   CACHE_DRIVER=redis
   ```

3. **启用 HTTPS**
   ```env
   SSL_ENABLED=true
   ```

4. **配置请求限流**
   ```env
   VERIFY_SIGNATURE=true
   ```

5. **监控日志级别**
   ```env
   LOG_LEVEL=info  # 生产环境
   ```

---

## 更多信息

- 📖 [完整优化报告](./OPTIMIZATION_REPORT.md)
- 📚 [开发手册](./docs/开发手册.md)
- 🔗 [API 文档](./docs/接口对接文档模版.md)
- 📝 [更新日志](./docs/CHANGELOG.md)

---

**祝你使用愉快！** 🎉
