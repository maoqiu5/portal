# BrianHub 文档中心 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 BrianHub 所有线上项目的标准化文档归档规则，并在门户登录后新增只读文档中心，便于按项目快速浏览 VPS 上的正式 Markdown 文档。

**Architecture:** 每个项目保留自己的 `docs/README.md` 作为文档入口；门户维护跨项目规则和文档索引配置。门户服务端只读扫描配置允许范围内的 Markdown 文件，排除 `node_modules`、`.venv`、`.git`、`backups`、`data`、`runtime`、`.pytest_cache` 等噪声目录，页面内展示索引并渲染安全转义后的 Markdown 文本。

**Tech Stack:** Node.js、Express、服务端渲染 HTML、node:test、supertest、VPS `/root/apps` 项目目录。

## Global Constraints

- 文档统一使用中文作为主要说明语言。
- 不在文档、页面、测试输出中记录真实密码、内部令牌或 AI API Key。
- 第一版文档中心只读，不提供在线编辑和删除。
- 文档浏览只能读取配置中的项目根目录，禁止任意路径读取。
- 邮件日报、备份文件、依赖包 README 不进入正式文档中心。

---

### Task 1: VPS 文档标准与项目入口

**Files:**
- Create/modify on VPS through local staging: `/root/apps/portal/docs/DOCUMENTATION_STANDARD.md`
- Create/modify on VPS through local staging: project `docs/README.md` files

**Interfaces:**
- Produces: 每个正式项目都有 `docs/README.md` 入口。
- Produces: 门户项目提供跨项目主规则文档。

- [ ] Step 1: 创建 BrianHub 文档标准，定义目录、命名、归档、排除规则。
- [ ] Step 2: 为缺入口的项目补 `docs/README.md`。
- [ ] Step 3: 对已有入口项目只做轻量修正，避免大规模重写业务文档。
- [ ] Step 4: 同步到 VPS 后抽样读取确认文件存在。

### Task 2: 门户文档索引服务

**Files:**
- Create: `src/documentStore.js`
- Modify: `test/server.test.js`
- Modify: `src/server.js`

**Interfaces:**
- Produces: `createDocumentStore({ projects })`
- Produces: `listDocuments()` returns `{ projects: [{ id, name, documents }] }`
- Produces: `getDocument(projectId, docPath)` returns `{ project, document, content }`

- [ ] Step 1: 写失败测试，验证 `/docs/index` 登录后返回项目和文档列表。
- [ ] Step 2: 写失败测试，验证 `/docs/view` 只能读取配置目录内文档，并拒绝路径穿越。
- [ ] Step 3: 实现 `documentStore` 和服务端路由。
- [ ] Step 4: 运行测试确认通过。

### Task 3: 门户文档中心页面

**Files:**
- Modify: `src/render.js`
- Modify: `public/styles.css`
- Modify: `test/server.test.js`

**Interfaces:**
- Consumes: `renderPortalPage({ documentation })`
- Produces: 登录后 `/?tab=docs` 文档中心页面。

- [ ] Step 1: 写失败测试，验证门户导航包含 `文档中心`。
- [ ] Step 2: 写失败测试，验证 `/?tab=docs` 展示项目文档列表和文档内容链接。
- [ ] Step 3: 实现页面渲染和样式。
- [ ] Step 4: 运行测试确认通过。

### Task 4: 部署和线上验证

**Files:**
- Modify on VPS: `/root/apps/portal/src/*`、`/root/apps/portal/public/styles.css`、`/root/apps/portal/test/server.test.js`
- Modify on VPS: `/root/apps/brianhub-gateway/Caddyfile` if new routes need explicit proxy.

**Interfaces:**
- Produces: 线上 `https://brianhub.net/?tab=docs` 可浏览文档。
- Produces: 线上 `/docs/index` 和 `/docs/view` 登录保护生效。

- [ ] Step 1: 本地 `pnpm test`。
- [ ] Step 2: 上传代码到 VPS。
- [ ] Step 3: VPS 容器内 `pnpm test`。
- [ ] Step 4: 重建门户容器。
- [ ] Step 5: 必要时更新并 reload Caddy。
- [ ] Step 6: 线上登录后验证文档中心页面、索引接口、单文档读取。
