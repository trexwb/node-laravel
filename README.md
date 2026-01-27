# Node Laravel Style Framework

> A Laravel-inspired backend framework built with **Node.js + Express + TypeScript + Knex.js**

这是一个受 **Laravel** 启发的 Node.js 后端框架，目标是在 Node.js 生态中提供类似 Laravel 的**优雅架构、清晰分层与良好开发体验**，同时保持 Node.js 的高性能与灵活性。

该框架适用于 **中大型后端项目**，强调：

* 约定优于配置
* 清晰的目录结构
* 可维护、可扩展的工程实践

---

## ✨ 特性（Features）

* ⚙️ **Laravel 风格目录结构**
  `app / config / routes / database / bootstrap` 清晰分层，职责明确

* 🧠 **TypeScript 全量支持**
  强类型约束，提升可维护性与重构安全性

* 🛣️ **Express HTTP 层封装**
  Controller / Middleware / Request Validation 分层清晰

* 🗄️ **Knex.js 数据库抽象**
  支持迁移（Migration）、种子（Seed），数据库驱动可扩展

* 🔧 **配置集中管理（config）**
  类似 Laravel 的 `config()` 辅助函数，支持点语法访问

* 🔌 **Service Provider 机制**
  统一初始化数据库、WebSocket、文件处理等第三方服务

* 🌐 **WebSocket 支持（ws）**
  模拟 Laravel Echo / Channels 的消息分发模式

* 🧵 **Cluster 多进程支持**
  在 `bootstrap` 层实现 Node.js 集群模式，充分利用多核 CPU

* 🔐 **内置加密工具**
  提供类似 Laravel `encrypt / decrypt` 的加解密封装

---

## 📦 技术栈

| 技术         | 说明            |
| ---------- | ------------- |
| Node.js    | 运行环境          |
| TypeScript | 语言            |
| Express    | HTTP 框架       |
| Knex.js    | SQL 查询构建 & 迁移 |
| MySQL2     | 数据库驱动         |
| ws         | WebSocket     |
| dotenv     | 环境变量          |
| sharp      | 图片处理          |
| lodash-es  | 工具函数          |
| dayjs      | 时间处理          |

---

## 📁 目录结构

```text
.
├── src/
│   ├── app/                    # 核心业务逻辑
│   │   ├── Console/            # 命令行任务
│   │   ├── Events/             # 事件系统
│   │   ├── Exceptions/         # 异常处理
│   │   ├── Http/
│   │   │   ├── Controllers/    # 控制器
│   │   │   ├── Middleware/     # 中间件
│   │   │   └── Requests/       # 请求校验
│   │   ├── Models/             # 数据模型（Knex）
│   │   ├── Providers/          # 服务提供者
│   │   ├── Services/           # 业务服务层
│   │   └── WebSockets/         # WebSocket 逻辑
│   ├── bootstrap/              # 启动引导（Cluster）
│   ├── config/                 # 配置文件
│   ├── database/
│   │   ├── migrations/         # 数据迁移
│   │   ├── seeds/              # 种子数据
│   │   └── knexfile.ts         # Knex 配置
│   ├── public/
│   │   ├── index.ts            # 程序入口（类似 Laravel index.php）
│   │   └── uploads/            # 图片上传目录
│   ├── resources/              # 原始资源
│   ├── routes/
│   │   ├── api.ts              # API 路由
│   │   └── channels.ts         # WS 频道
│   ├── storage/                # 日志 / 缓存
│   └── utils/                  # 工具类
├── .env
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🚪 应用入口（public/index.ts）

`public/index.ts` 是整个应用的唯一入口，类似 Laravel 的 `public/index.php`：

* 加载 `.env` 环境变量
* 初始化配置与服务容器
* 启动 Express / WebSocket
* 所有 HTTP 请求统一从此进入

这样做的好处是：

* 🔒 **提升安全性**（源码不暴露）
* 🔁 **入口统一，生命周期清晰**

---

## 🔌 Service Providers（服务提供者）

在 `app/Providers` 中集中初始化第三方服务，例如：

* 数据库（Knex）
* WebSocket（ws）
* 文件处理（sharp）
* 事件系统

Providers 会在应用启动时自动加载，并将实例挂载到全局容器或 `app.locals`，供业务层使用。

---

## 🗄️ 数据库 & 迁移

### 运行迁移

```bash
npm run migrate:latest
```

### 创建迁移文件

```bash
npm run migrate:make create_users_table
```

### 运行种子数据

```bash
npm run seed:run
```

---

## 🌐 WebSocket & Channels

WebSocket 逻辑集中在：

```text
app/WebSockets/
routes/channels.ts
```

你可以像 Laravel Echo 一样：

* 定义频道（Channel）
* 将消息分发到不同业务模块
* 与 HTTP API 共用 Service / Model

---

## 🔐 加密工具（utils/crypto.ts）

提供类似 Laravel 的加解密接口：

```ts
encrypt(value: string): string
decrypt(payload: string): string
```

适用于：

* 敏感字段存储
* Token / Payload 加密
* 临时安全数据传输

---

## 🚀 开发 & 构建

### 本地开发

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 启动生产服务

```bash
npm run start
```

---

# 📊 错误码规范

## 📁 错误码结构

所有错误码遵循 **状态码 + 目录码 + 文件码 + 错误序号** 的四段式结构：

`状态码(3位) - 目录码(3位) - 文件码(3位) - 错误序号(3位)`

**示例：** `401006014001`

---

## 🎯 状态码（第一段）

| 状态码 | 说明 |
|--------|------|
| 1xx | 信息响应 |
| 100 | 客户端可继续发送请求体（常用于POST大文件前的预检） |
| 101 | 切换协议 |
| 102 | 处理中 |
| 103 | 请求范围已就绪 |
| 2xx | 成功响应 |
| 200 | 请求成功 |
| 201 | 新资源已创建 |
| 202 | 已接受 |
| 203 | 非授权信息 |
| 204 | 无内容 |
| 205 | 重置内容 |
| 206 | 部分内容 |
| 3xx | 重定向 |
| 301 | 永久重定向 |
| 302 | 临时重定向 |
| 303 | 查看其它位置 |
| 304 | 未修改 |
| 4xx | 客户端错误 |
| 400 | 错误请求 |
| 401 | 未授权 |
| 402 | 需要付款 |
| 403 | 禁止访问 |
| 404 | 未找到 |
| 405 | 方法不允许 |
| 408 | 请求超时 |
| 413 | 请求实体过大 |
| 414 | 请求URI过长 |
| 415 | 不支持的媒体类型 |
| 429 | 请求过多 |
| 5xx | 服务器错误 |
| 500 | 服务器内部错误 |
| 501 | 未实现 |
| 502 | 网关错误 |
| 503 | 服务不可用 |
| 504 | 网关超时 |
| 505 | HTTP版本不受支持 |

---

## 📂 业务层目录码（第二段）

| 码 | 目录 |
|----|------|
| 001 | app/Casts |
| 002 | app/Console |
| 003 | app/Console/Commands |
| 004 | app/Events |
| 005 | app/Exceptions |
| 006 | app/Helpers |
| 007 | app/Http |
| 008 | app/Http/Controllers |
| 009 | app/Http/Middleware |
| 010 | app/Http/Requests |
| 011 | app/Jobs |
| 012 | app/Listeners |
| 013 | app/Models |
| 014 | app/Providers |
| 015 | app/Services |
| 016 | app/Services/Cache |
| 017 | app/Services/Image |
| 018 | app/Services/Secrets |
| 019 | app/Services/Users |
| 020 | app/WebSockets |
| 021 | app/Traits |

---

## 📄 文件码（第三段）

| 码 | 文件 |
|----|------|
| 001 | app/Casts/CastBoolean.ts |
| 002 | app/Casts/CastDateTime.ts |
| 003 | app/Casts/CastInterface.ts |
| 004 | app/Casts/CastJson.ts |
| 005 | app/Console/Commands/QueueWorker.ts |
| 006 | app/Console/Kernel.ts |
| 007 | app/Events/WriteLogsEvents.ts |
| 008 | app/Exceptions/Handler.ts |
| 009 | app/Helpers/Format.ts |
| 010 | app/Helpers/Str.ts |
| 011 | app/Http/Controllers/AuthorizeController.ts |
| 012 | app/Http/Controllers/UsersController.ts |
| 013 | app/Http/Middleware/AuthenticateSecret.ts |
| 014 | app/Http/Middleware/AuthenticateToken.ts |
| 015 | app/Http/Middleware/Authorize.ts |
| 016 | app/Http/Middleware/DecryptRequest.ts |
| 017 | app/Http/Middleware/EncryptResponse.ts |
| 018 | app/Http/Middleware/ForceHttps.ts |
| 019 | app/Http/Middleware/RefreshToken.ts |
| 020 | app/Http/Middleware/ResponseWrapper.ts |
| 021 | app/Http/Middleware/Throttle.ts |
| 022 | app/Http/Middleware/VerifySignature.ts |
| 023 | app/Jobs/Job.ts |
| 024 | app/Jobs/SendWelcomeEmail.ts |
| 025 | app/Models/BaseModel.ts |
| 026 | app/Models/JobsModel.ts |
| 027 | app/Models/PermissionsModel.ts |
| 028 | app/Models/RolesModel.ts |
| 029 | app/Models/RolesPermissionsModel.ts |
| 030 | app/Models/SecretsModel.ts |
| 031 | app/Models/UsersLogsModel.ts |
| 032 | app/Models/UsersModel.ts |
| 033 | app/Models/UsersRolesModel.ts |
| 034 | app/Providers/AppServiceProvider.ts |
| 035 | app/Services/Cache/CacheFileDriver.ts |
| 036 | app/Services/Cache/CacheRedisDriver.ts |
| 037 | app/Services/Cache/CacheService.ts |
| 038 | app/Services/Cache/CacheSqliteDriver.ts |
| 039 | app/Services/Image/ImageService.ts |
| 040 | app/Services/Secrets/SecretsService.ts |
| 041 | app/Services/Users/UsersService.ts |
| 042 | app/WebSockets/ChatHandler.ts |

---

## 🎬 错误序号（第四段）

错误序号从 `001` 开始，在同一文件中按需递增，确保同一文件内的错误码不重复。

---

## 📌 使用示例

### 示例场景
`app/Http/Middleware/AuthenticateSecret.ts` 中验证 appId 和 appSecret：

```typescript
if (!appId || !appSecret) {
  return res.error('401006014001', 'appId/appSecret 不能为空');
}
```

### 错误码解析
- **401** - 状态码：未授权
- **006** - 目录码：`app/Http/Middleware`
- **014** - 文件码：`AuthenticateSecret.ts`
- **001** - 错误序号：该文件中第一个定义的错误

---

## 💡 最佳实践

1. **统一格式**：所有错误码使用三段连字符分隔的格式
2. **文档同步**：新增文件时及时更新文件码表格
3. **错误信息**：错误码需配以清晰的中文说明
4. **序号管理**：同一文件内的错误序号应连续且不重复
5. **多端同步**：通过这种方式，可将数字与提示信息一一对应，形成统一的错误码表，便于前后端协同使用，并支持多语言场景的灵活扩展。

---

> 📝 注意：错误码设计为可读性强、定位精确的结构，便于快速定位问题来源。

## 📌 设计理念

> **让 Node.js 后端开发拥有 Laravel 一样的“秩序感”**

* 不追求“魔法”，而是**清晰可读**
* 不重复造轮子，但**统一工程规范**
* 为长期维护和团队协作而设计

---

## 📄 License

MIT License

---

## 🙌 致谢

* Laravel
* Express
* Knex.js
* Node.js Community
