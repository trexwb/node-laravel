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

| 技术                   | 说明                 | 版本                                                                 |
|------------------------|----------------------|----------------------------------------------------------------------|
| Node.js                | 运行环境               | ![Static Badge](https://img.shields.io/badge/Node-%E2%89%A522.21.1-green)        |
| TypeScript             | 语言                   | ![Static Badge](https://img.shields.io/badge/TypeScript-%E2%89%A55.9.3-green)   |
| cors                   | 跨域                   | ![Static Badge](https://img.shields.io/badge/Cors-%E2%89%A52.8.6-green)         |
| dayjs                  | 时间处理               | ![Static Badge](https://img.shields.io/badge/Dayjs-%E2%89%A51.11.19-green)        |
| dotenv                 | 环境变量               | ![Static Badge](https://img.shields.io/badge/Dotenv-%E2%89%A517.2.3-green)      |
| express                | 框架                   | ![Static Badge](https://img.shields.io/badge/Express-%E2%89%A55.2.1-green)      |
| express-rate-limit     | 请求限制               | ![Static Badge](https://img.shields.io/badge/ExpressRateLimit-%E2%89%A58.2.1-green) |
| helmet                 | 安全                   | ![Static Badge](https://img.shields.io/badge/helmet-%E2%89%A58.1.0-green)       |
| http-proxy-middleware  | 代理                   | ![Static Badge](https://img.shields.io/badge/HttpProxyMiddleware-%E2%89%A53.0.5-green) |
| knex                   | ORM                   | ![Static Badge](https://img.shields.io/badge/Knex-%E2%89%A53.1.0-green)         |
| lodash-es              | 函数式                 | ![Static Badge](https://img.shields.io/badge/LodashES-%E2%89%A54.17.23-green)     |
| multer                 | 文件上传               | ![Static Badge](https://img.shields.io/badge/Multer-%E2%89%A52.0.2-green)       |
| mysql2                 | 数据库                 | ![Static Badge](https://img.shields.io/badge/Mysql2-%E2%89%A53.16.2-green)       |
| node-schedule          | 定时任务               | ![Static Badge](https://img.shields.io/badge/NodeSchedule-%E2%89%A52.1.1-green) |
| objection              | ORM                   | ![Static Badge](https://img.shields.io/badge/Objection-%E2%89%A53.1.5-green)    |
| redis                  | 缓存 / 队列             | ![Static Badge](https://img.shields.io/badge/Redis-%E2%89%A55.10.0-green)        |
| sharp                  | 图片处理                | ![Static Badge](https://img.shields.io/badge/Sharp-%E2%89%A50.34.5-green)        |
| sqlite3                | 缓存 / 队列 / 数据库     | ![Static Badge](https://img.shields.io/badge/Sqlite3-%E2%89%A55.1.7-green)      |
| validatorjs            | 表单验证                | ![Static Badge](https://img.shields.io/badge/Validatorjs-%E2%89%A53.22.1-green)  |
| ws                     | WebSocket              | ![Static Badge](https://img.shields.io/badge/Ws-%E2%89%A58.19.0-green)           |

---

## 📁 目录结构

```text
.
├── src/
│   ├── app/                    # 核心业务逻辑
│   │   ├── Casts/              # 数据转换
│   │   ├── Console/            
│   │   ├── Console/Commands/   # 命令行任务
│   │   ├── Events/             # 事件系统
│   │   ├── Exceptions/         # 异常处理
│   │   ├── Helpers/            # 助手函数
│   │   ├── Http/
│   │   │   ├── Controllers/    # 控制器
│   │   │   ├── Middleware/     # 中间件
│   │   │   └── Requests/       # 请求校验
│   │   ├── Jobs/               # 异步任务
│   │   ├── Listeners/          # 监听器
│   │   ├── Models/             # 数据模型（Knex）
│   │   ├── Providers/          # 服务提供者
│   │   ├── Services/           # 业务服务层
│   │   ├── Traits/             # trait
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
│   │   ├── apis/               # API 子路由
│   │   ├── apis/console/       # 控制台
│   │   ├── apis/front/         # 前台
│   │   ├── api.ts              # API 路由
│   │   └── channels.ts         # WS 频道
│   ├── storage/                
│   │   ├── cache/              # 缓存
│   │   └── uploads/            # 文件上传
│   └── utils/                  # 工具类
├── tests/                      # 测试
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
npm run start:dev
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
| 001 | src/app/Casts |
| 002 | src/app/Console |
| 003 | src/app/Console/Commands |
| 004 | src/app/Console/Schedules |
| 005 | src/app/Events |
| 006 | src/app/Exceptions |
| 007 | src/app/Helpers |
| 008 | src/app/Http |
| 009 | src/app/Http/Controllers |
| 010 | src/app/Http/Middleware |
| 011 | src/app/Http/Requests |
| 012 | src/app/Jobs |
| 013 | src/app/Listeners |
| 014 | src/app/Models |
| 015 | src/app/Providers |
| 016 | src/app/Services |
| 017 | src/app/Services/Cache |
| 018 | src/app/Services/Image |
| 019 | src/app/Services/Schedules |
| 020 | src/app/Services/Secrets |
| 021 | src/app/Services/Users |
| 022 | src/app/Traits |
| 023 | src/app/WebSockets |

---

## 📄 文件码（第三段）

| 码 | 文件 |
|----|------|
| 001 | src/app/Casts/CastBoolean.ts |
| 002 | src/app/Casts/CastDateTime.ts |
| 003 | src/app/Casts/CastInterface.ts |
| 004 | src/app/Casts/CastJson.ts |
| 001 | src/app/Console/Kernel.ts |
| 001 | src/app/Console/Commands/QueueWorker.ts |
| 002 | src/app/Console/Commands/TaskRunner.ts |
| 001 | src/app/Console/Schedules/CacheTask.ts |
| 001 | src/app/Events/WriteLogsEvents.ts |
| 001 | src/app/Exceptions/Handler.ts |
| 001 | src/app/Helpers/Format.ts |
| 002 | src/app/Helpers/Str.ts |
| 001 | src/app/Http/Controllers/AuthorizeController.ts |
| 002 | src/app/Http/Controllers/SchedulesController.ts |
| 003 | src/app/Http/Controllers/SecretsController.ts |
| 004 | src/app/Http/Controllers/UsersController.ts |
| 001 | src/app/Http/Middleware/AuthenticateSecret.ts |
| 002 | src/app/Http/Middleware/AuthenticateToken.ts |
| 003 | src/app/Http/Middleware/Authorize.ts |
| 004 | src/app/Http/Middleware/DecryptRequest.ts |
| 005 | src/app/Http/Middleware/EncryptResponse.ts |
| 006 | src/app/Http/Middleware/ForceHttps.ts |
| 007 | src/app/Http/Middleware/RefreshToken.ts |
| 008 | src/app/Http/Middleware/ResponseWrapper.ts |
| 009 | src/app/Http/Middleware/Throttle.ts |
| 010 | src/app/Http/Middleware/VerifySignature.ts |
| 001 | src/app/Http/Requests/BaseRequest.ts |
| 002 | src/app/Http/Requests/ScheduleSaveRequest.ts |
| 003 | src/app/Http/Requests/SecretSaveRequest.ts |
| 004 | src/app/Http/Requests/UserSaveRequest.ts |
| 001 | src/app/Jobs/Job.ts |
| 002 | src/app/Jobs/SendWelcomeEmail.ts |
| 001 | src/app/Models/BaseModel.ts |
| 002 | src/app/Models/ConfigsModel.ts |
| 003 | src/app/Models/JobsModel.ts |
| 004 | src/app/Models/PermissionsModel.ts |
| 005 | src/app/Models/RolesModel.ts |
| 006 | src/app/Models/RolesPermissionsModel.ts |
| 007 | src/app/Models/SchedulesLogsModel.ts |
| 008 | src/app/Models/SchedulesModel.ts |
| 009 | src/app/Models/SecretsLogsModel.ts |
| 010 | src/app/Models/SecretsModel.ts |
| 011 | src/app/Models/UsersLogsModel.ts |
| 012 | src/app/Models/UsersModel.ts |
| 013 | src/app/Models/UsersRolesModel.ts |
| 001 | src/app/Providers/AppServiceProvider.ts |
| 001 | src/app/Services/Cache/CacheFileDriver.ts |
| 002 | src/app/Services/Cache/CacheRedisDriver.ts |
| 003 | src/app/Services/Cache/CacheService.ts |
| 004 | src/app/Services/Cache/CacheSqliteDriver.ts |
| 001 | src/app/Services/Image/ImageService.ts |
| 001 | src/app/Services/Schedules/SchedulesService.ts |
| 001 | src/app/Services/Secrets/SecretsService.ts |
| 001 | src/app/Services/Users/UsersService.ts |
| 001 | src/app/Traits/HashPasswordTrait.ts |
| 001 | src/app/WebSockets/ChatHandler.ts |

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
- **010** - 目录码：`app/Http/Middleware`
- **001** - 文件码：`AuthenticateSecret.ts`
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

## Stargazers over time

[![Stargazers over time](https://starchart.cc/trexwb/node-laravel.svg?variant=adaptive)](https://starchart.cc/trexwb/node-laravel)

---


## 🙌 致谢

* Laravel
* Express
* Knex.js
* Node.js Community
