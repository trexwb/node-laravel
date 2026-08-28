---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 16825e3339a4e87ec3619b4c10842061_3e7faf63a2b711f192a2525400287e28
    ReservedCode1: YUs4E/iH2KrhemImxuL0F5eV1EeV/pMR7pCFXwGAu06qFemMKi9C+D2tnjuELRPjzz3KcCtSwq0JT0Hnn7VjNQkKaupjjSZxPqAiCIIxXmxliL8wuwEr9eSZgPz6rgUtqv2LLqSq0fE2TvKEjpTLSO413L0t8CucEN7/Lqvysg78tc+H0zxOkUY5/FM=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 16825e3339a4e87ec3619b4c10842061_3e7faf63a2b711f192a2525400287e28
    ReservedCode2: YUs4E/iH2KrhemImxuL0F5eV1EeV/pMR7pCFXwGAu06qFemMKi9C+D2tnjuELRPjzz3KcCtSwq0JT0Hnn7VjNQkKaupjjSZxPqAiCIIxXmxliL8wuwEr9eSZgPz6rgUtqv2LLqSq0fE2TvKEjpTLSO413L0t8CucEN7/Lqvysg78tc+H0zxOkUY5/FM=
---

# AGENTS.md — AI 开发规范

> 本文件约束所有在此仓库中编写、修改代码的 **AI Agent 与开发者**。
> **任何代码变更必须遵守本规范，违反者提交前会被 `tsc --noEmit` / `npm run build` 拦截或 code review 打回。**

---

## 0. 🔴 最高优先级硬性红线：禁止一切 Git 操作

> **本节为整个文档的最高优先级规则，凌驾于本文件其他所有章节之上，任何 Agent 均无权豁免或覆盖。**

### 0.1 绝对禁止

本仓库**禁止任何 Agent（含各类 AI agent / 自动化工具 / 脚本）执行一切 git 操作**，包括但不限于：

- **版本控制命令**：`git init`、`git add`、`git commit`、`git push`、`git pull`、`git fetch`、`git clone`、`git merge`、`git rebase`、`git reset`、`git revert`、`git checkout`、`git stash`、`git clean`、`git restore`、`git gc`、`git branch`、`git tag` 及所有其他 `git <子命令>`。
- **仓库状态读写**：禁止读取或修改 `.git` 目录、git 配置、暂存区（index/stage）、索引或任何仓库状态。
- **版本历史**：禁止提交、回滚、删除、改写或以任何方式修改本仓库的代码版本历史。

### 0.2 拒绝策略

- 遇到任何与 git 相关的诉求（包括但不限于提交代码、推送、拉取、合并、回滚、查看状态/日志、初始化仓库、配置 git、清理 .git 等），**一律直接拒绝**，不做任何解释或变通尝试。
- 拒绝时**提示用户手动处理**：如“git 操作请由用户在终端/客户端手动完成，Agent 不执行任何 git 命令”。
- 严禁通过脚本、子进程、别名、变体命令（如 `git.exe`、`/usr/bin/git`、`git -C ...`）或第三方工具间接执行 git 操作，严禁以“检查状态”“确认变更”“统计代码”等名义变相调用 git。

### 0.3 唯一例外

- 本仓库中**允许修改的内容**为仓库内的源码 / 文档文件（如 `src/`、`docs/`、`README.md`、`AGENTS.md` 等）。
- 文件内容的编辑（新建 / 修改 / 删除文件内容）**不视为 git 操作**，不受本节限制；但**任何对 `.git` 目录、git 配置、暂存区、索引、版本历史的读写一律禁止**。

---

## 1. 仓库目录结构

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
│   │   │   ├── Middleware/         # 中间件
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
│   └── types/                      # 全局类型声明（*.d.ts）
├── docs/                           # 文档（README / QUICK_START / 开发手册 / version/ 变更日志）
├── tests/                          # 测试
├── AGENTS.md                       # 本文件（AI 开发规范）
├── package.json
├── tsconfig.json
└── README.md
```

---

## 2. 命名规范

| 对象 | 规范 | 示例 |
| --- | --- | --- |
| 目录 | PascalCase | `Controllers/`、`Services/` |
| 类文件 | PascalCase.ts | `HealthController.ts` |
| 工具/配置文件 | camelCase.ts | `configLoader.ts`、`cryptoTool.ts` |
| 控制器类 | `XxxController`，静态方法一个动作 | `ExampleController.index` |
| 服务类 | `XxxService` | `ExampleUserService` |
| 接口 | `Xxx` / `XxxInterface` | `CacheDriver`、`CastInterface` |
| 方法 | camelCase | `public list()` |
| 常量 | UPPER_SNAKE_CASE | `SENSITIVE_PATHS` |
| 中间件 | camelCase 函数 | `authenticateSecret`、`verifySignature` |

- 新文件必须带**文件头注释**（见第 5 节）。

---

## 3. import 使用 `#` 子路径（禁止相对路径跨层引用）

仓库通过 `#` 子路径别名组织 import，**严禁**写 `../../../app/...` 这类跨层相对路径。

| 别名 | 指向 |
| --- | --- |
| `#app/*` | `./src/app/*` |
| `#bootstrap/*` | `./src/bootstrap/*` |
| `#config/*` | `./src/config/*` |
| `#database/*` | `./src/database/*` |
| `#public/*` | `./src/public/*` |
| `#resources/*` | `./src/resources/*` |
| `#routes/*` | `./src/routes/*` |
| `#storage/*` | `./src/storage/*` |
| `#types/*` | `./src/types/*.d.ts` |
| `#utils/*` | `./src/app/Helpers/*` |

```ts
// ✅ 正确
import { config } from '#bootstrap/configLoader'
import { Container } from '#app/Foundation/Container'
import { ExampleUserService } from '#app/Services/Example/ExampleUserService'
import type { NextFunction, Request, Response } from 'express'

// ❌ 错误
import { config } from '../../bootstrap/configLoader'
```

**类型导入**必须使用 `import type`（工程开启 `verbatimModuleSyntax`）：

```ts
import type { SecretProvider } from '#types/framework'
```

---

## 4. tsconfig paths 说明

- 别名映射维护在 **两处**，需保持一致：
  1. `tsconfig.json` 的 `compilerOptions.paths`
  2. `package.json` 的 `imports` 字段（Node 运行时解析）
- 构建命令 `npm run build` 执行 `tsc && tsc-alias`，将 `#` 别名编译为相对路径后产出 `dist/`
- 新增顶级子目录时，需同步在以上两处注册对应别名（`#xxx/*` → `./src/xxx/*`）

---

## 5. 文件头注释模板（新建 / 修改文件必带）

```ts
/*
 * @Author: trexwb
 * @Date: 2026-08-28
 * @LastEditors: trexwb
 * @LastEditTime: 2026-08-28
 * @FilePath: node-laravel/src/app/Http/Controllers/Front/ExampleController.ts
 * @Description:
 * 一句话说明本文件的职责与使用方式（示例：……）
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
```

- `@FilePath` 使用 `node-laravel/` 相对仓库根的路径，**禁止**出现 `stl-dev-server` 等旧路径。
- `@Date` / `@LastEditTime` 格式为 `YYYY-MM-DD`。

---

## 6. 类型安全与 `tsc --noEmit` 校验

- **任何提交前**必须运行 `npx tsc --noEmit` 且 **0 错误**。
- 工程为严格模式：`strict / noImplicitAny / strictNullChecks / noUnusedLocals / noUnusedParameters / noImplicitReturns`。
- **严禁 `any` 类型**；确无法推断时使用 `unknown` + 类型守卫。
- 未使用的变量/参数必须以 `_` 前缀或删除（`_req` / `_res` / `_next`）。
- 控制器 / 中间件签名统一：`(req: Request, res: Response, next: NextFunction)`。

---

## 7. 路由 / 控制器 / 服务分层规范

| 层 | 目录 | 职责 | 禁止 |
| --- | --- | --- | --- |
| 路由层 | `src/routes/*.ts` | URL → 控制器映射 | 业务逻辑 |
| 控制器层 | `src/app/Http/Controllers/` | 参数解析、调用服务、返回响应 | 复杂业务、直接 SQL |
| 服务层 | `src/app/Services/` | 业务逻辑、数据编排 | 直接接触 req/res |
| 模型层 | `src/app/Models/` | 数据模型（继承 BaseModel） | 业务逻辑 |

- **依赖注入**：通过 `src/app/Foundation/Container.ts` 的 `bind / singleton / instance / resolve` 完成。

```ts
// 控制器中解析服务（未注册时 fallback 兜底）
const service = Container.resolve<ExampleUserService>('example.userService', () => new ExampleUserService())
```

- **路由注册注意**：
  - 前台路由：注册在 `src/routes/web.ts`，**必须位于 `/{*splat}` 通配代理之前**，否则被代理吞掉。
  - API 路由：注册在 `src/routes/api.ts` 的网关中间件链之后，继承统一鉴权 / 签名 / 加解密能力。
  - 业务方接入 API 网关需通过 `Container` 注册 `auth.secretProvider` 等依赖。
- 控制器示例见：`src/app/Http/Controllers/Front/ExampleController.ts`、`src/app/Http/Controllers/Api/ExampleUserController.ts`。

---

## 8. 响应与错误码规范

- 成功响应：`res.success(data, code?, msg?)`。
- 错误响应：`res.error(code, msg)`。
- 错误码四段式：`状态码(3) - 目录码(3) - 文件码(3) - 错误序号(3)`，规范详见 `docs/README.md`。

---

## 9. 提交前检查清单（AI Agent 必须逐项自检）

1. [ ] `npx tsc --noEmit` 通过（0 错误）
2. [ ] `npm run build` 通过（tsc && tsc-alias）
3. [ ] 文件头注释完整，`@FilePath` 为 `node-laravel/...`，无 `stl-dev-server` 旧路径
4. [ ] import 使用 `#` 子路径，无相对路径跨层引用；类型用 `import type`
5. [ ] 遵循路由 / 控制器 / 服务 / 模型分层，无 `any`、无未使用变量
6. [ ] 新增路由已正确注册（web 路由在通配代理前，api 路由在网关链后）
7. [ ] 无破坏既有路由 / 中间件链的变更
8. [ ] 变更已同步更新 `docs/version/` 变更日志与 `docs/CHANGELOG.md`
*（内容由AI生成，仅供参考）*
