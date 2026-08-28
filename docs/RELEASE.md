# 发布说明 (Release Notes)

本文件汇总各版本发布说明，详细版本记录见 [`docs/version/`](./version/)。

---

## v1.0.0（2026-08-28）

### 概述
Node Laravel Style Framework 首个正式版本。框架从史特牢（STL）后端提取落地，并完成首轮框架级优化。

### 主要变更
- 路由 `front.ts` → `web.ts`，统一 Laravel 风格
- 新增控制器层示例（Web / API / 服务注入三件套）
- 新增 `docs/version/` 版本化变更记录
- 新增根目录 `AGENTS.md` AI 开发规范
- 全量更新 docs 文档与根 README（含应用案例：史特牢、仟标、大美）
- http-proxy-middleware 升级至 4.2.0，兼容性验证通过

### 兼容性
- `http-proxy-middleware@4.2.0` 与现有代理代码（`target / changeOrigin / pathRewrite / ws`）完全兼容，无需改动代理逻辑。
- 引用 `#routes/front` 的外部代码需改为 `#routes/web`。

### 构建要求
- Node.js >= 22
- 构建命令：`npm install` → `npx tsc --noEmit` → `npm run build`
- 启动：`npm run dev`（开发） / `npm start`（生产）

### 升级注意
1. 业务方接入 API 网关需通过 `Container` 注册 `auth.secretProvider` 等依赖。
2. 新增前台路由须注册在 `web.ts` 的 `/{*splat}` 通配代理之前。
