# Nora Framework

> **The Elegant Node.js Framework for Artisans.** \> **专为追求优雅架构的开发者打造的 Node.js 框架。**

[](https://www.google.com/search?q=LICENSE)
[](https://nodejs.org)
[](https://www.typescriptlang.org/)

-----

## 🌟 Introduction / 简介

**Nora** is a high-performance Node.js framework inspired by the elegance of Laravel. It bridges the gap between the flexibility of Node.js and the rigorous architecture of modern PHP frameworks. Designed with a "Thin Controller, Fat Service" philosophy, Nora provides a seamless development experience for building scalable APIs and Microservices.

**Nora** 是一款深受 Laravel 优雅设计启发的 Node.js 高性能框架。它在 Node.js 的灵活性与现代后端框架的严谨架构之间找到了完美的平衡。Nora 坚持“瘦控制器，厚服务层”的设计理念，为构建可扩展的 API 和微服务提供丝滑的开发体验。

-----

## ✨ Key Features / 核心特性

  * 🛡️ **Type-Safe by Default**: Built with TypeScript for a robust, refactor-friendly codebase.

  * 🏗️ **Layered Architecture**: Clear separation of concerns with `Controllers`, `Services`, `Requests`, and `Traits`.

  * 📡 **Native JSON-RPC**: Built-in support for microservice communication with dynamic method loading.

  * 🧪 **Smart Validation**: Independent `Request` layer to keep your controllers clean and focused.

  * 🔌 **Modular Integrations**: Easily extendable drivers for Payments (WeChat/Alipay), Storage, and more.

  * 🚀 **ESM Native**: Fully embraces the modern JavaScript module system.

  * 🛡️ **原生类型安全**: 基于 TypeScript 构建，提供强大的代码健壮性和重构支持。

  * 🏗️ **分层架构**: 完善的 `Controllers`、`Services`、`Requests` 及 `Traits` 分层映射。

  * 📡 **原生 JSON-RPC**: 内置微服务通讯支持，支持动态方法加载与代理调用。

  * 🧪 **智能校验**: 独立的 `Request` 校验层，让控制器保持极致简洁。

  * 🔌 **模块化集成**: 易于扩展的支付（微信/支付宝）、存储等第三方驱动。

  * 🚀 **纯粹 ESM**: 全面拥抱现代 JavaScript 模块标准。

-----

## 📂 Directory Structure / 目录结构

```text
src/
├── app/
│   ├── Http/
│   │   ├── Controllers/  # Route Handlers
│   │   ├── Middleware/   # Filter Logic
│   │   └── Requests/     # Validation & Sanitization
│   ├── Services/         # Business Logic
│   ├── Models/           # Database Entities (Objection/Knex)
│   ├── Traits/           # Reusable Logic Pieces
│   └── Integrations/     # Third-party SDKs (Payments, etc.)
├── bootstrap/            # App Bootstrapper & Loaders
├── routes/               # API & RPC Route Definitions
└── utils/                # Helper Functions
```

-----

## 🚀 Quick Start / 快速开始

### Installation / 安装

```bash
git clone https://github.com/trexwb/node-laravel.git nora-app
cd nora-app
npm install
```

### Configuration / 配置

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### Run / 运行

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

-----

## 💡 Why Nora? / 为什么选择 Nora?

In the Node.js ecosystem, you often choose between "too simple" (Express) or "too complex" (NestJS). **Nora** provides the middle ground: a structured, opinionated, yet lightweight framework that feels familiar to Laravel developers but performs with the speed of Node.js.

在 Node.js 生态中，开发者常在“过于简单”（Express）与“过于复杂”（NestJS）之间抉择。**Nora** 提供了中间地带：一个有结构、有态度但依然轻量的框架。它让 Laravel 开发者感到亲切，同时拥有 Node.js 的极致性能。

-----

## 📄 License / 开源协议

The Nora framework is open-sourced software licensed under the [MIT license](https://www.google.com/search?q=LICENSE).

Nora 框架遵循 [MIT 开源协议](https://www.google.com/search?q=LICENSE)。
