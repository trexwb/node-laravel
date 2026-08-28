---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 16825e3339a4e87ec3619b4c10842061_44eef352a2b711f192a2525400287e28
    ReservedCode1: h431sF8Gf7ceIcbesQVrNVtig5vYzATOD4VJTtwadiz0aDEffqOd7TROhhHaUiApTuZIiQc1g/jgHxeeE1wpMjsZ0XlUPbXdZBQ3kKgKKGWTVEVxDqmN+5i+RCDsadNmfbg3IdyIJIAQHBoeJ3W0dBCa3iTkc6/Yh6D2L3CYTSLTKrnsMlXrNbz8l9s=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 16825e3339a4e87ec3619b4c10842061_44eef352a2b711f192a2525400287e28
    ReservedCode2: h431sF8Gf7ceIcbesQVrNVtig5vYzATOD4VJTtwadiz0aDEffqOd7TROhhHaUiApTuZIiQc1g/jgHxeeE1wpMjsZ0XlUPbXdZBQ3kKgKKGWTVEVxDqmN+5i+RCDsadNmfbg3IdyIJIAQHBoeJ3W0dBCa3iTkc6/Yh6D2L3CYTSLTKrnsMlXrNbz8l9s=
---

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

> 注：框架本体内不含业务迁移与种子，业务方在各自项目中维护自己的迁移文件。

### 5. 启动开发服务器
```bash
npm run dev
```

服务器默认启动在 **`http://localhost:3000`**（由 `app.web.front.port` 配置，默认 3000），健康检查：

```bash
curl http://localhost:3000/health
```

---

## 🗺️ 路由与控制器示例（照葫芦画瓢）

### 路由更名说明
原 `src/routes/front.ts` 已更名为 **`src/routes/web.ts`**（贴合 Laravel `web.php` 惯例）。引用旧 `#routes/front` 的代码需改为 `#routes/web`。

### 路由文件职责

| 路由文件 | 挂载前缀 | 职责 |
| --- | --- | --- |
| `src/routes/web.ts` | `/` | 前台（Web）路由 + 静态资源 + SPA 代理 |
| `src/routes/api.ts` | `/api` | API 网关路由（统一鉴权 / 签名 / 加解密 / 限流 / 追踪） |
| `src/routes/console.ts` | `/console` | 控制台路由 + SPA 代理 |
| `src/routes/event.ts` / `src/routes/channels.ts` | - | 事件订阅 / WebSocket 频道 |

### 控制器示例
框架内置 **Web 控制器 + API 控制器 + 服务层** 三件套示例，可直接照葫芦画瓢：

* `src/app/Http/Controllers/Front/ExampleController.ts` → `GET /example`、`GET /example/:id`、`POST /example`
* `src/app/Http/Controllers/Api/ExampleUserController.ts` → `GET /api/example/users`、`GET /api/example/users/:id`
* `src/app/Services/Example/ExampleUserService.ts` → 业务逻辑层，通过 `Container` 依赖注入

控制器通过 `res.success(data, code?, msg?)` 返回统一响应、`res.error(code, msg)` 返回错误；服务通过 `Container.resolve<XxxService>('key', () => new XxxService())` 注入。

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
| --- | --- |
| `npm run dev` | 开发模式（热重载） |
| `npm run build` | 构建生产版本（tsc && tsc-alias） |
| `npm start` | 启动生产服务器 |
| `npm run artisan` | 生产环境命令行工具 |
| `npm run artisan:dev` | 开发模式运行命令行工具 |
| `npm run migrate:latest` | 运行数据库迁移 |
| `npm run seed:run` | 运行数据库种子 |
| `npm run knex -- ...` | 直接调用 Knex CLI |

---

## 健康检查

应用启动后，访问健康检查端点：
```bash
curl http://localhost:3000/health
```

响应示例：
```json
{
  "status": "ok",
  "pid": 12345,
  "uptime": 3600,
  "timestamp": "2026-08-28T13:45:00.000Z"
}
```

---

## 日志查看

### 开发环境
日志输出到控制台，彩色格式：
```
[13:45:30] INFO  [req-uuid] --> GET /api/example/users
[13:45:31] DEBUG [req-uuid] SELECT * FROM users LIMIT 10
[13:45:31] INFO  [req-uuid] GET /api/example/users → 200 (45ms)
```

### 生产环境
日志输出为 JSON 格式（便于日志聚合）：
```json
{
  "timestamp": "2026-08-28T13:45:31.000Z",
  "level": "info",
  "pid": 12345,
  "message": "GET /api/example/users → 200 (45ms)"
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

### 问题：API 网关报 `auth.secretProvider not registered`
```
[Error] AuthenticateSecret: auth.secretProvider not registered
```
**解决**: 业务方需通过 `Container` 注册密钥提供者（注入键：`auth.secretProvider`），详见 `src/app/Http/Middleware/AuthenticateSecret.ts`

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

- 📖 [docs 目录](./README.md)
- 📚 [开发手册](./开发手册.md)
- 🔗 [接口对接文档模版](./接口对接文档模版.md)
- 📝 [变更日志](./CHANGELOG.md)
- 🗂️ [版本记录](./version/)
- 📄 [发布说明](./RELEASE.md)
- 🤖 [AI 开发规范](../AGENTS.md)

---

**祝你使用愉快！** 🎉
*（内容由AI生成，仅供参考）*
