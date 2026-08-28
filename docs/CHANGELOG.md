# 变更日志 (Changelog)

本项目变更记录格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 约定，版本遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)。

- 详细的分版本记录请见 [`docs/version/`](./version/)
- 每次发布需在 `docs/version/` 下新建 `vX.Y.Z.md`，并在本文件汇总

---

## [1.0.0] - 2026-08-28

### 里程碑
框架从 **史特牢（STL）** 项目后端提取落地，剥离业务逻辑沉淀为 Laravel 风格 Node.js 框架；同时完成首轮框架级优化（共 7 项）。

### 新增
- **路由更名**：`src/routes/front.ts` → `src/routes/web.ts`（贴合 Laravel `web.php` 惯例），`src/bootstrap/app.ts` 引用同步更新为 `#routes/web`。
- **控制器层示例**：
  - Web 控制器 `Front/ExampleController`（`GET /example`、`GET /example/:id`、`POST /example`）
  - API 控制器 `Api/ExampleUserController`（`GET /api/example/users`、`GET /api/example/users/:id`）
  - 服务层 `Services/Example/ExampleUserService`（演示 Container 依赖注入）
- **`docs/version/` 目录**：建立版本化变更记录机制，首个版本文件为 `docs/version/v1.0.0.md`。
- **`AGENTS.md`**：新增 AI 开发规范，约束所有 Agent 按规范编写文件。
- **文档对齐**：更新 `docs/README.md`、`docs/QUICK_START.md`、`docs/开发手册.md`、`docs/接口对接文档模版.md`、`docs/OPTIMIZATION_REPORT.md`，补全空文档 `CHANGELOG.md`、`RELEASE.md`。
- **根 README.md**：补充框架简介、技术栈、目录结构、快速开始、文档入口，并新增**应用案例**（史特牢 STL、仟标、大美）。

### 依赖升级验证
- **http-proxy-middleware `4.2.0` 兼容性验证通过**：现有 `src/routes/web.ts`、`src/routes/console.ts` 中 `createProxyMiddleware` 的 `target / changeOrigin / pathRewrite / ws` 用法完全兼容；`npx tsc --noEmit` 与 `npm run build` 均通过，**代理代码无需改动**。

### 修复
- 统一历史遗留文件头 `@FilePath`：`src/routes/web.ts`、`src/routes/console.ts`、`src/routes/channels.ts` 由 `stl-dev-server/...` 更新为 `node-laravel/...`。

### 校验
- `npx tsc --noEmit`：0 错误
- `npm run build`（tsc && tsc-alias）：通过
