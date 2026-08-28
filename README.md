---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 16825e3339a4e87ec3619b4c10842061_3977e1b5a2b711f193c6525400f8a581
    ReservedCode1: daiYuVWDxHxCw9m5XOJytqRONruBNKpq+IBIlXp0Kz6ZNqy03D4cjr0542u5u4nwMi359Ehg1XvYrC7JxcJdZirG63sUF3svaceQ3nt1pbEas4uriP6e8OTdVZHhwLZ5VcwzuDoqxSKtKy1UvgrP7x/K/QSarqNnzVElVwfisZUpivp59aqi/C0GbeM=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 16825e3339a4e87ec3619b4c10842061_3977e1b5a2b711f193c6525400f8a581
    ReservedCode2: daiYuVWDxHxCw9m5XOJytqRONruBNKpq+IBIlXp0Kz6ZNqy03D4cjr0542u5u4nwMi359Ehg1XvYrC7JxcJdZirG63sUF3svaceQ3nt1pbEas4uriP6e8OTdVZHhwLZ5VcwzuDoqxSKtKy1UvgrP7x/K/QSarqNnzVElVwfisZUpivp59aqi/C0GbeM=
---

# Node-Laravel（Node Laravel Style Framework）

> A Laravel-inspired backend framework built with **Node.js + Express + TypeScript + Knex.js**.
> 专为追求优雅架构的开发者打造的 **Laravel 风格 Node.js 后端框架**。

该框架由 **史特牢（STL）** 项目后端提取沉淀而来，剥离业务逻辑，将通用的 Laravel 风格架构能力框架化，已应用于 **史特牢（STL）**、**仟标**、**大美** 等多个企业及系统。

---

## ✨ 框架简介

**Node-Laravel** 是一款受 **Laravel** 启发的 Node.js 后端框架，目标是在 Node.js 生态中提供类似 Laravel 的**优雅架构、清晰分层与良好开发体验**，同时保持 Node.js 的高性能与灵活性。

设计哲学：

* **约定优于配置**：清晰固定的目录结构，降低团队协作成本
* **瘦控制器、厚服务层**：控制器只做参数解析与响应，业务逻辑沉淀在 Service
* **依赖注入（Container）**：基于轻量服务容器统一管理服务与依赖
* **企业级安全**：内置密钥鉴权、请求签名、请求解密、响应加密、限流等中间件

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
| dotenv / cors / validatorjs | 环境变量 / 跨域 / 表单验证 | 均最新 |

---

## 📁 目录结构

```text
node-laravel/
├── src/
│   ├── app/
│   │   ├── Casts/                  # 数据转换（实现 CastInterface）
│   │   ├── Console/                # 命令行：Kernel.ts、Commands/QueueWorker.ts
│   │   ├── Events/                 # 事件定义（BaseEvent）
│   │   ├── Exceptions/             # 异常处理（Handler.ts）
│   │   ├── Foundation/             # 框架基础（Container 服务容器）
│   │   ├── Helpers/                # 助手函数（ControllerHelper/QueryHelper 等）
│   │   ├── Http/
│   │   │   ├── Controllers/        # 控制器（Front/、Api/、WebSocket/）
│   │   │   ├── Middleware/         # 中间件（鉴权/签名/加解密/限流/追踪）
│   │   │   └── Requests/           # 请求校验（BaseRequest）
│   │   ├── Interfaces/             # 接口定义（CacheDriver/CastInterface/JobInstance）
│   │   ├── Jobs/                   # 异步任务（继承 Job）
│   │   ├── Listeners/              # 事件监听（BaseListener）
│   │   ├── Models/                 # 数据模型（继承 BaseModel，Objection/Knex）
│   │   ├── Providers/              # 服务提供者（AppServiceProvider）
│   │   └── Services/               # 业务服务层（纯业务逻辑，不接触 req/res）
│   ├── bootstrap/                  # 启动引导：app.ts / cluster.ts / events.ts / routeLoader.ts / schedule.ts
│   ├── config/                     # 配置（app.ts / cache.ts / database.ts）
│   ├── database/                   # knexfile.ts 数据库配置
│   ├── public/                     # 入口 index.ts（类似 Laravel public/index.php）
│   ├── resources/                  # 原始资源
│   ├── routes/                     # 路由：web.ts / api.ts / console.ts / event.ts / channels.ts
│   ├── storage/                    # 存储
│   ├── types/                      # 全局类型声明（*.d.ts）
│   └── utils/                      # 通用工具函数
├── docs/                           # 文档（README / QUICK_START / 开发手册 / version/ 变更日志）
├── tests/                          # 测试
├── AGENTS.md                       # AI 开发规范（所有 AI Agent 编写代码必须遵守）
├── package.json
├── tsconfig.json
└── README.md
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

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

至少配置必填项：

```env
# 🔴 必填：安全密钥（生成方式见下方）
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

生成安全密钥：

```bash
openssl rand -hex 32   # 复制输出到 APP_KEY
openssl rand -hex 16   # 复制输出到 APP_IV
```

### 3. 启动开发服务器

```bash
npm run dev
```

服务器默认启动在 `http://localhost:3000`，健康检查：`curl http://localhost:3000/health`

### 4. 构建 / 生产

```bash
npm run build   # tsc && tsc-alias
npm start       # node ./dist/src/public/index.js
```

---

## 📖 文档入口

| 文档 | 说明 |
| --- | --- |
| [快速启动指南](docs/QUICK_START.md) | 环境准备、部署、常用命令 |
| [docs 目录](docs/README.md) | 框架特性、目录结构、错误码规范 |
| [开发手册](docs/开发手册.md) | 分层架构、模型、缓存、队列、控制器与路由 |
| [接口对接文档模版](docs/接口对接文档模版.md) | 签名 / 加密 / 网关鉴权 / 错误码对接规范 |
| [变更日志](docs/CHANGELOG.md) | 版本变更汇总 |
| [版本记录](docs/version/) | 按版本归档的详细变更日志 |
| [发布说明](docs/RELEASE.md) | 各版本发布说明 |
| [优化报告](docs/OPTIMIZATION_REPORT.md) | 历史优化记录 |
| [AGENTS.md](AGENTS.md) | AI 开发规范 |

---

## 🏢 应用案例

本框架已成功应用于以下企业及系统，承载其后端 API、Web 前台、控制台与管理后台：

* **史特牢（STL）**：框架的起源项目，框架从其后端提取沉淀而来
* **仟标**：基于本框架构建的业务系统
* **大美**：基于本框架构建的业务系统

---

## 📄 License

MIT License
*（内容由AI生成，仅供参考）*
