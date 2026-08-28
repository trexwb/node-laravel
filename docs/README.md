---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 16825e3339a4e87ec3619b4c10842061_421d18cca2b711f193c6525400f8a581
    ReservedCode1: R9LVdN6HVoW05u8YSgStrv6BsBYzIDOsFsu+91mtd+apfhwR2qvmQcO6/4HOm5v6spLrQqmZgk84hO8mcKyWABKWckD8pkYLh95M/0dnDWWURo3F8H8VpSVS1tYOKKaB56u3PkTcX6iOm5k710nUEkBQdA7yk8qGVvdjnxSoZyF82PPBLFpUYuWW6Rk=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 16825e3339a4e87ec3619b4c10842061_421d18cca2b711f193c6525400f8a581
    ReservedCode2: R9LVdN6HVoW05u8YSgStrv6BsBYzIDOsFsu+91mtd+apfhwR2qvmQcO6/4HOm5v6spLrQqmZgk84hO8mcKyWABKWckD8pkYLh95M/0dnDWWURo3F8H8VpSVS1tYOKKaB56u3PkTcX6iOm5k710nUEkBQdA7yk8qGVvdjnxSoZyF82PPBLFpUYuWW6Rk=
---

# Node-Laravel（Node Laravel Style Framework）

> 它是 Node 和 Laravel 的某种韵律结合（取 No 和 ra）。

> A Laravel-inspired backend framework built with **Node.js + Express + TypeScript + Knex.js**

这是一个受 **Laravel** 启发的 Node.js 后端框架，目标是在 Node.js 生态中提供类似 Laravel 的**优雅架构、清晰分层与良好开发体验**，同时保持 Node.js 的高性能与灵活性。

该框架由 **史特牢（STL）** 项目后端提取沉淀而来，已应用于 **史特牢（STL）**、**仟标**、**大美** 等多个企业及系统。

适用于 **中大型后端项目**，强调：

* 约定优于配置
* 清晰的目录结构
* 可维护、可扩展的工程实践

---

## ✨ 特性（Features）

* ⚙️ **Laravel 风格目录结构**
  `app / config / routes / database / bootstrap` 清晰分层，职责明确

* 🧠 **TypeScript 全量支持（严格模式）**
  `strict / noUnusedLocals / noUnusedParameters`，提升可维护性与重构安全性

* 🛣️ **Express HTTP 层封装**
  Controller / Middleware / Request Validation 分层清晰

* 💉 **轻量服务容器（Container）**
  通过 `bind / singleton / instance / resolve` 统一管理服务与依赖注入

* 🗄️ **Knex.js 数据库抽象**
  基于 Objection.js（Eloquent 风格），模型继承 `BaseModel`

* 🔧 **配置集中管理（config）**
  类似 Laravel 的 `config()` 辅助函数，支持点语法访问

* 🔌 **Service Provider 机制**
  统一初始化数据库、WebSocket、事件、缓存等第三方服务

* 🌐 **WebSocket 支持（ws）**
  模拟 Laravel Echo / Channels 的消息分发模式

* 🧵 **Cluster 多进程支持**
  在 `bootstrap` 层实现 Node.js 集群模式，充分利用多核 CPU

* 🔐 **企业级安全**
  密钥鉴权、请求签名、请求解密、响应加密、限流、全链路追踪（TraceId）

* 📦 **`#` 子路径别名**
  `#app/* #routes/* #types/* #app/Helpers/*` 等，告别相对路径地狱

---

## 📦 技术栈

| 技术 | 说明 | 版本 |
| --- | --- | --- |
| Node.js | 运行环境 | >= 22 |
| TypeScript | 语言 | ^7.0.2 |
| Express | HTTP 框架 | ^5.2.1 |
| Knex / Objection | 数据库 ORM | ^3.3.0 / ^3.1.5 |
| MySQL2 / SQLite3 | 数据库驱动 | ^3.24.2 / ^6.0.1 |
| Redis | 缓存 / 队列 | ^6.2.1 |
| http-proxy-middleware | 反向代理 | ^4.2.0 |
| ws | WebSocket | ^8.21.3 |
| pino / pino-pretty | 结构化日志 | ^10.3.1 / ^13.1.3 |
| helmet | 安全头 | ^8.3.0 |
| express-rate-limit | 请求限流 | ^8.6.2 |
| node-schedule | 定时任务 | ^2.1.1 |
| sharp | 图片处理 | ^0.35.4 |
| multer | 文件上传 | ^2.2.0 |
| uuid | UUID 生成 | ^14.0.2 |
| dotenv / cors / dayjs / lodash-es / validatorjs | 工具库 | 均最新 |

---

## 📁 目录结构

```text
src/
├── app/
│   ├── Casts/                  # 数据转换（实现 CastInterface）
│   ├── Console/                # 命令行：Kernel.ts、Commands/QueueWorker.ts
│   ├── Events/                 # 事件定义（BaseEvent，System/ 为框架级事件）
│   ├── Exceptions/             # 异常处理（Handler.ts）
│   ├── Foundation/             # 框架基础（Container 服务容器）
│   ├── Helpers/                # 助手函数（ControllerHelper/QueryHelper/FilterHelper 等）
│   ├── Http/
│   │   ├── Controllers/        # 控制器（Front/、Api/、WebSocket/）
│   │   ├── Middleware/         # 中间件（鉴权/签名/加解密/限流/追踪）
│   │   └── Requests/           # 请求校验（BaseRequest）
│   ├── Interfaces/             # 接口定义（CacheDriver/CastInterface/JobInstance）
│   ├── Jobs/                   # 异步任务（继承 Job）
│   ├── Listeners/              # 事件监听（BaseListener）
│   ├── Models/                 # 数据模型（继承 BaseModel，Objection/Knex）
│   ├── Providers/              # 服务提供者（AppServiceProvider）
│   └── Services/               # 业务服务层（纯业务逻辑，不接触 req/res）
├── bootstrap/                  # 启动引导：app.ts / cluster.ts / events.ts / routeLoader.ts / schedule.ts
├── config/                     # 配置（app.ts / cache.ts / database.ts）
├── database/                   # knexfile.ts 数据库配置
├── public/                     # 入口 index.ts（类似 Laravel public/index.php）
├── resources/                  # 原始资源
├── routes/                     # 路由：web.ts / api.ts / console.ts / event.ts / channels.ts
├── storage/                    # 存储
├── types/                      # 全局类型声明（*.d.ts）
└── utils/                      # 通用工具函数
```

---

## 🗺️ 路由结构

| 路由文件 | 挂载前缀 | 职责 |
| --- | --- | --- |
| `src/routes/web.ts` | `/` | 前台（Web）路由 + 静态资源 + SPA 代理（对应 Laravel `web.php`，由原 `front.ts` 更名而来） |
| `src/routes/api.ts` | `/api` | API 网关路由（统一鉴权 / 签名 / 加解密 / 限流 / 追踪） |
| `src/routes/console.ts` | `/console` | 控制台（Console）路由 + SPA 代理 |
| `src/routes/event.ts` | - | 事件订阅路由 |
| `src/routes/channels.ts` | - | WebSocket 频道 |

> **注意**：`web.ts` 由原 `front.ts` 重命名而来，引用旧 `#routes/front` 的代码需改为 `#routes/web`。

---

## 🚪 应用入口（public/index.ts）

`public/index.ts` 是整个应用的唯一入口，类似 Laravel 的 `public/index.php`：

* 加载 `.env` 环境变量
* 初始化配置与服务容器
* 启动 Express / WebSocket / Cluster
* 所有 HTTP 请求统一从此进入

---

## 💉 服务容器（Foundation/Container）

`src/app/Foundation/Container.ts` 提供轻量服务容器，用于依赖注入：

```ts
import { Container } from '#app/Foundation/Container'

// 注册
Container.bind('example.userService', () => new ExampleUserService())
Container.singleton('cache', () => new CacheService())
Container.instance('foo', someInstance)

// 解析（未注册时可用 fallback 兜底）
const service = Container.resolve<ExampleUserService>('example.userService', () => new ExampleUserService())
```

---

## 🎮 控制器与路由示例

框架提供 **Web 控制器 + API 控制器 + 服务层** 三件套示例，可直接照葫芦画瓢：

| 类型 | 文件 | 路由 |
| --- | --- | --- |
| Web 控制器 | `src/app/Http/Controllers/Front/ExampleController.ts` | `GET /example`、`GET /example/:id`、`POST /example` |
| API 控制器 | `src/app/Http/Controllers/Api/ExampleUserController.ts` | `GET /api/example/users`、`GET /api/example/users/:id` |
| 服务层 | `src/app/Services/Example/ExampleUserService.ts` | 承载业务逻辑，通过 Container 注入 |

Web 路由注册于 `src/routes/web.ts`（`/{*splat}` 通配代理之前）：

```ts
import { ExampleController } from '#app/Http/Controllers/Front/ExampleController'
router.get('/example', ExampleController.index)
router.get('/example/:id', ExampleController.show)
router.post('/example', ExampleController.store)
```

API 路由注册于 `src/routes/api.ts`（网关中间件链之后），自动继承统一鉴权 / 签名 / 加解密能力。

---

## 🔌 Service Providers（服务提供者）

在 `app/Providers` 中集中初始化第三方服务，例如：

* 数据库（Knex）
* WebSocket（ws）
* 文件处理（sharp）
* 事件系统 / 缓存

Providers 会在应用启动时自动加载，并通过容器提供给业务层。

---

## 🗄️ 数据库 & 迁移

框架内置 Knex 配置（`src/database/knexfile.ts`），业务方在各自项目中维护迁移与种子：

```bash
npm run migrate:latest
npm run migrate:make create_users_table
npm run seed:run
```

---

## 🌐 WebSocket & Channels

WebSocket 逻辑集中在：

```text
src/routes/channels.ts
src/app/Http/Controllers/WebSocket/ChannelController.ts
```

你可以像 Laravel Echo 一样：

* 定义频道（Channel）
* 将消息分发到不同业务模块
* 与 HTTP API 共用 Service / Model

---

## 🔐 加密工具（utils/cryptoTool.ts）

提供加解密、哈希、签名等工具：

```ts
import { CryptoTool } from '#app/Helpers/cryptoTool'

CryptoTool.encrypt(value)          // AES-256-CBC 加密
CryptoTool.decrypt(payload)        // AES-256-CBC 解密
CryptoTool.sha256(value)           // SHA256
CryptoTool.hmacSha256(value, key)  // HMAC-SHA256
CryptoTool.md5(value)              // MD5
```

---

## 🚀 开发 & 构建

```bash
npm run dev        # 开发模式（ts-node 热重载）
npm run build      # 构建生产版本（tsc && tsc-alias）
npm start          # 启动生产服务
npm run artisan    # 生产环境命令行工具
npm run artisan:dev# 开发环境命令行工具
```

---

# 📊 错误码规范

## 📁 错误码结构

所有错误码遵循 **状态码 + 目录码 + 文件码 + 错误序号** 的四段式结构：

`状态码(3位) - 目录码(3位) - 文件码(3位) - 错误序号(3位)`

**示例：** `401000100001`

---

## 🎯 状态码（第一段）

| 状态码 | 说明 |
| --- | --- |
| 2xx | 成功响应（200 成功 / 201 已创建 / 204 无内容） |
| 3xx | 重定向（301 / 302 / 304） |
| 4xx | 客户端错误（400 / 401 未授权 / 403 禁止 / 404 / 422 / 429 请求过多） |
| 5xx | 服务器错误（500 / 502 / 503 / 504） |

---

## 📂 业务层目录码（第二段）

| 码 | 目录 |
| --- | --- |
| 001 | src/app/Casts |
| 002 | src/app/Console |
| 003 | src/app/Console/Commands |
| 004 | src/app/Events |
| 005 | src/app/Exceptions |
| 006 | src/app/Foundation |
| 007 | src/app/Helpers |
| 008 | src/app/Http |
| 009 | src/app/Http/Controllers |
| 010 | src/app/Http/Middleware |
| 011 | src/app/Http/Requests |
| 012 | src/app/Interfaces |
| 013 | src/app/Jobs |
| 014 | src/app/Listeners |
| 015 | src/app/Models |
| 016 | src/app/Providers |
| 017 | src/app/Services |
| 018 | src/app/Services/Cache |
| 019 | src/app/Services/Example |
| 020 | src/app/Services/Queue |
| 021 | src/app/Services/Rpc |
| 022 | src/app/Helpers |

---

## 📄 文件码（第三段）

| 码 | 文件 |
| --- | --- |
| 001 | src/app/Casts/CastBooleanCasts.ts |
| 002 | src/app/Casts/CastDateTimeCasts.ts |
| 003 | src/app/Casts/CastJsonCasts.ts |
| 001 | src/app/Console/Kernel.ts |
| 001 | src/app/Console/Commands/QueueWorker.ts |
| 001 | src/app/Events/BaseEvent.ts |
| 002 | src/app/Events/System/CacheInvalidated.ts |
| 003 | src/app/Events/System/ScheduleChanged.ts |
| 004 | src/app/Events/System/WriteLogs.ts |
| 001 | src/app/Exceptions/Handler.ts |
| 001 | src/app/Foundation/Container.ts |
| 001 | src/app/Helpers/CacheHelper.ts |
| 002 | src/app/Helpers/ControllerHelper.ts |
| 003 | src/app/Helpers/FilterHelper.ts |
| 004 | src/app/Helpers/LogHandleHelper.ts |
| 005 | src/app/Helpers/OrmGraphHelper.ts |
| 006 | src/app/Helpers/QueryHelper.ts |
| 007 | src/app/Helpers/StatTypeHelper.ts |
| 008 | src/app/Helpers/TransformerHelper.ts |
| 001 | src/app/Http/Controllers/Front/HealthController.ts |
| 002 | src/app/Http/Controllers/Front/ExampleController.ts |
| 003 | src/app/Http/Controllers/Api/ExampleUserController.ts |
| 004 | src/app/Http/Controllers/WebSocket/ChannelController.ts |
| 001 | src/app/Http/Middleware/AuthenticateSecret.ts |
| 002 | src/app/Http/Middleware/AuthenticateToken.ts |
| 003 | src/app/Http/Middleware/Authorize.ts |
| 004 | src/app/Http/Middleware/DecryptRequest.ts |
| 005 | src/app/Http/Middleware/EncryptResponse.ts |
| 006 | src/app/Http/Middleware/ForceHttps.ts |
| 007 | src/app/Http/Middleware/OptionalAuth.ts |
| 008 | src/app/Http/Middleware/RefreshToken.ts |
| 009 | src/app/Http/Middleware/ResponseWrapper.ts |
| 010 | src/app/Http/Middleware/Throttle.ts |
| 011 | src/app/Http/Middleware/TraceId.ts |
| 012 | src/app/Http/Middleware/ValidateRequest.ts |
| 013 | src/app/Http/Middleware/VerifySignature.ts |
| 001 | src/app/Http/Requests/BaseRequest.ts |
| 001 | src/app/Interfaces/CacheDriver.ts |
| 002 | src/app/Interfaces/CastInterface.ts |
| 003 | src/app/Interfaces/JobInstance.ts |
| 001 | src/app/Jobs/Job.ts |
| 001 | src/app/Listeners/BaseListener.ts |
| 002 | src/app/Listeners/System/CacheInvalidatedListener.ts |
| 003 | src/app/Listeners/System/WriteLogsListener.ts |
| 001 | src/app/Models/BaseModel.ts |
| 001 | src/app/Providers/AppServiceProvider.ts |
| 001 | src/app/Services/Example/ExampleUserService.ts |
| 001 | src/app/Services/Cache/CacheFileDriver.ts |
| 002 | src/app/Services/Cache/CacheRedisDriver.ts |
| 003 | src/app/Services/Cache/CacheService.ts |
| 001 | src/app/Services/Queue/DatabaseQueueService.ts |
| 001 | src/app/Services/Rpc/CircuitBreaker.ts |
| 002 | src/app/Services/Rpc/JsonRpcClient.ts |
| 003 | src/app/Services/Rpc/LoadRpcClients.ts |
| 001 | src/app/Helpers/amount.ts |
| 002 | src/app/Helpers/cryptoTool.ts |
| 003 | src/app/Helpers/format.ts |
| 004 | src/app/Helpers/hashPassword.ts |
| 005 | src/app/Helpers/index.ts |
| 006 | src/app/Helpers/logger.ts |
| 007 | src/app/Helpers/mask.ts |
| 008 | src/app/Helpers/query.ts |
| 009 | src/app/Helpers/readKey.ts |
| 010 | src/app/Helpers/requestContext.ts |
| 011 | src/app/Helpers/string.ts |
| 012 | src/app/Helpers/treeBuilder.ts |
| 013 | src/app/Helpers/validation.ts |

---

## 🎬 错误序号（第四段）

错误序号从 `001` 开始，在同一文件中按需递增，确保同一文件内的错误码不重复。

---

## 📌 使用示例

### 示例场景
`src/app/Http/Middleware/AuthenticateSecret.ts` 中验证 appId 和 appSecret：

```typescript
if (!appId || !appSecret) {
  return res.error(401000100001, 'appId/appSecret is empty')
}
```

### 错误码解析
- **401** - 状态码：未授权
- **000** - 目录码：`Http`（顶层）
- **100** - 文件码：`Http/Middleware/AuthenticateSecret.ts`（中间件文件码按目录内 001 起编，实际以代码为准）
- **001** - 错误序号：该文件中第一个定义的错误

---

## 💡 最佳实践

1. **统一格式**：所有错误码使用 12 位数字（三段连写）
2. **文档同步**：新增文件时及时更新文件码表格
3. **错误信息**：错误码需配以清晰的中文说明
4. **序号管理**：同一文件内的错误序号应连续且不重复
5. **多端同步**：通过这种方式，可将数字与提示信息一一对应，形成统一的错误码表，便于前后端协同使用，并支持多语言场景的灵活扩展。

---

## 📌 设计理念

> **让 Node.js 后端开发拥有 Laravel 一样的“秩序感”**

* 不追求“魔法”，而是**清晰可读**
* 不重复造轮子，但**统一工程规范**
* 为长期维护和团队协作而设计

---

## 🤖 AI 协作

所有 AI Agent 在此仓库编写代码，必须遵守根目录 [AGENTS.md](../AGENTS.md) 中的开发规范（目录结构 / 命名 / `#` 子路径 / 文件头模板 / `tsc --noEmit` 校验 / 提交前 build 通过等）。

---

## 📄 License

MIT License
*（内容由AI生成，仅供参考）*
