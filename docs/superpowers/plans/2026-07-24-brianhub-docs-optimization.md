# BrianHub 文档中心优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化 BrianHub 门户的中文显示、文档中心体检、Markdown 浏览体验和文档索引性能。

**Architecture:** `src/documentStore.js` 继续作为文档读取边界，新增缓存、体检和 Markdown 渲染所需的结构化字段。`src/server.js` 暴露 `/docs/audit`，`src/render.js` 和 `public/styles.css` 负责中文 UI、体检提示、筛选和正文展示。

**Tech Stack:** Node.js CommonJS、Express、原生 `node:test`、Supertest、无新增外部依赖。

## Global Constraints

- 所有用户可见页面和提示使用中文。
- 不在页面、接口或文档中输出真实密码、API Key、内部令牌或 Cookie。
- 文档中心只读扫描 VPS `/root/apps` 挂载目录。
- 文档索引排除依赖、数据、日志、备份、密钥和过程文件。

---

### Task 1: 中文文案修复

**Files:**
- Modify: `src/render.js`
- Modify: `src/server.js`
- Modify: `test/server.test.js`

**Interfaces:**
- Consumes: existing `renderLoginPage`, `renderPortalPage`, Express routes.
- Produces: UTF-8 Chinese page text and redirect messages.

- [ ] 写失败测试：断言登录页、门户页、弹窗、文档中心使用真实中文。
- [ ] 运行 `pnpm test`，确认因乱码断言失败。
- [ ] 修复 `src/render.js` 与 `src/server.js` 中文文案。
- [ ] 运行 `pnpm test`，确认通过。

### Task 2: 文档体检和缓存

**Files:**
- Modify: `src/documentStore.js`
- Modify: `src/server.js`
- Modify: `test/documentStore.test.js`
- Modify: `test/server.test.js`

**Interfaces:**
- Produces: `docsStore.auditDocuments()` 返回项目文档完整度和风险摘要。
- Produces: `GET /docs/audit` 返回体检 JSON。

- [ ] 写失败测试：缺少核心文档时返回缺失项，疑似密钥只返回风险类型和路径，不返回密钥值。
- [ ] 写失败测试：短时间重复读取使用缓存，缓存过期后重新扫描。
- [ ] 实现 `auditDocuments()` 和 60 秒缓存。
- [ ] 增加 `/docs/audit` 登录保护接口。
- [ ] 运行 `pnpm test`，确认通过。

### Task 3: 文档中心浏览优化

**Files:**
- Modify: `src/render.js`
- Modify: `public/styles.css`
- Modify: `test/server.test.js`

**Interfaces:**
- Consumes: `documentation.projects[].audit` and selected document content.
- Produces: 项目状态徽章、文档数量、分类筛选、更新时间展示和基础 Markdown HTML。

- [ ] 写失败测试：文档中心页面包含体检徽章、文档数量、筛选控件和 Markdown HTML 容器。
- [ ] 实现页面渲染和样式。
- [ ] 运行 `pnpm test`，确认通过。

### Task 4: 部署验证

**Files:**
- Deploy local portal files to `/root/apps/portal` on VPS.

- [ ] 在本地运行 `pnpm test`。
- [ ] 同步代码到 VPS。
- [ ] 在 VPS Docker 环境运行门户测试。
- [ ] 检查线上 `/docs/index`、`/docs/audit` 和 `/?tab=docs`。
