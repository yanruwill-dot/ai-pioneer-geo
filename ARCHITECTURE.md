# 系统架构

```text
React / Vite 前端
  ├─ CRM 客户管理
  ├─ 一键登录产品选择
  ├─ GEO 运营与分析
  ├─ 智能体官网生成与管理
  └─ 企业官网公开页面
           │ Bearer session
           ▼
Express API
  ├─ auth
  ├─ crm
  ├─ geo assets
  ├─ publish / automation
  ├─ public website read API
  └─ dashboard aggregation
           │
           ▼
SQLite
  users / sessions / customers / keywords / knowledge
  publish_tasks / automations / observations
  module_items / module_settings
```

## GitHub Pages 演示部署

```text
React / Vite 静态站点
        │
        ▼
浏览器本地数据层 demoApi.js
        │
        ▼
localStorage（仅当前访问者）
```

`main` 分支推送后由 `.github/workflows/deploy-pages.yml` 自动构建并部署。工作流生成 `404.html` 作为 SPA 回退页，Vite 使用 `/ai-pioneer-geo/` 资源基路径。

## 关键设计

- CRM 与 GEO 共用一个会话，但 GEO 的数据请求必须带当前 `customerId`。
- 一键登录接口只返回客户上下文和目标产品，不复制或泄露其他客户数据。
- 驾驶舱指标从 `observations` 聚合，避免把页面展示数值硬编码在前端。
- 业务资源统一使用 JSON API，后续可替换为 PostgreSQL 或真实外部服务。
- 深层业务页统一写入 `module_items`，身份与智能体配置写入 `module_settings`，刷新页面后仍可回查。
- 官网生成器从当前客户的实名认证、知识库、图片素材与文章记录组装网站草稿；最终网站配置写入 `module_settings.agent.website`。
- `/api/public/site/:customerId` 只暴露已生成的网站配置和公开文章摘要，不返回智能体名片、客服或其他内部设置。
- 前台固定生成首页、关于、产品、新闻、图集和联系页面；管理后台按官方手册拆分为模板、域名、栏目、内容、SEO、城市分站与留言入口。
- 登录密码使用 scrypt 哈希；会话 token 使用 24 字节随机值。
