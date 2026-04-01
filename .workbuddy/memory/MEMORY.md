# 长期记忆

## 项目：node-laravel-framework

- 技术栈：Node.js + TypeScript + Express + Knex + Objection.js
- 架构：Laravel 风格分层（Controller/Service/Model/Middleware/Request/Provider）
- 项目是 ESM 模式（`"type": "module"`），测试框架应选 Vitest 而非 Jest
- 错误码为四段式：状态码-目录码-文件码-序号，文档在 README.md
- 路径别名：`#app/*`、`#bootstrap/*` 等，定义在 package.json `imports` 字段

## 已知技术债（2026-04-01 审阅）

- `UsersService.clearUserCache` 中 6 个 forget 无 await（竞态）
- `UsersService.updateToken` 中 modifyById 无 await（竞态）
- `UsersModel.buildQuery` keywords 搜索 SQL 字段名格式错误（反引号包裹整个 tableName.field）
- Controller 中大量 `(req as any)` 强转，应使用已声明的 express.d.ts 类型
- 无任何单元测试（tests/ 只有工具脚本）
- `BaseModel.deleteByFilters` 缺少 `this: T` 泛型参数，导致子类 softDelete 可能不生效
