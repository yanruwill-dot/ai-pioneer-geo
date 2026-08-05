# API

除健康检查和登录外，接口都需要 `Authorization: Bearer <token>`。

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api/health` | 服务健康检查 |
| POST | `/api/auth/login` | 账号登录 |
| GET | `/api/auth/me` | 当前用户 |
| POST | `/api/auth/logout` | 注销会话 |
| GET/POST | `/api/crm/customers` | 客户列表与新增 |
| POST | `/api/crm/customers/:id/enter-geo` | 一键进入客户 GEO |
| GET | `/api/dashboard?customerId=1` | GEO 聚合指标 |
| GET/POST | `/api/keywords` | 关键词管理 |
| GET/POST | `/api/knowledge` | 企业知识库 |
| GET/POST | `/api/publish-tasks` | 发布任务 |
| PATCH | `/api/publish-tasks/:id` | 更新任务进度 |
| GET | `/api/automations` | 自动化任务 |
| PATCH | `/api/automations/:id/toggle` | 启停自动化任务 |
| GET | `/api/observations` | AI 平台采样明细 |
| GET/POST | `/api/module-items` | 深层业务模块列表与新增 |
| PATCH | `/api/module-items/:id` | 更新业务记录与状态 |
| GET/PUT | `/api/module-settings/:module` | 实名认证、AI 智能体配置读写 |
