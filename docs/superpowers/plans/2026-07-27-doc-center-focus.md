# 文档中心聚焦阅读 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把门户文档中心从全展开文档墙改成快速入口、项目折叠、核心文档优先的聚焦阅读体验。

**Architecture:** 只修改服务端渲染和 CSS，不改变文档扫描、审计 API 或数据结构。`renderDocsPanel` 按标准文档和专题文档分组输出 HTML，前端筛选脚本在搜索/分类命中时自动展开项目。

**Tech Stack:** Node.js、Express、服务端 HTML 字符串渲染、CSS、`node:test`。

## Global Constraints

- 所有页面和显示保持中文。
- 不写真实密码、API Key、Token、Cookie 或可复用认证头。
- 不改变 `/docs/index`、`/docs/audit`、`/docs/view` 的接口语义。
- 不重启生产服务，除非用户另行要求。

---

### Task 1: 页面测试

**Files:**
- Modify: `test/server.test.js`

**Interfaces:**
- Consumes: `GET /?tab=docs`
- Produces: 测试断言新 HTML 包含 `.doc-quick-links`、`.doc-project-toggle`、`.doc-core-list`、`.doc-more-docs`

- [ ] Step 1: 修改现有文档中心测试，加入新布局断言。
- [ ] Step 2: 运行 `npm test`，预期新增断言失败。

### Task 2: 渲染实现

**Files:**
- Modify: `src/render.js`

**Interfaces:**
- Produces: `renderDocsPanel()` 输出快速入口、项目折叠、核心文档优先、更多文档折叠

- [ ] Step 1: 新增标准文档识别和排序逻辑。
- [ ] Step 2: 修改项目块为 `<details class="doc-project">`。
- [ ] Step 3: 增加快速入口区。
- [ ] Step 4: 更新筛选脚本，让命中项目自动展开。
- [ ] Step 5: 运行 `npm test`，预期测试通过或暴露样式/断言差异。

### Task 3: 样式优化

**Files:**
- Modify: `public/styles.css`

**Interfaces:**
- Produces: 聚焦阅读布局样式、快速入口、折叠项目、核心/更多文档样式

- [ ] Step 1: 添加快速入口样式。
- [ ] Step 2: 调整项目摘要和折叠内容样式。
- [ ] Step 3: 保持移动端一列布局。
- [ ] Step 4: 运行 `npm test`。

### Task 4: 文档与验证

**Files:**
- Modify: `docs/CHANGELOG.md`

**Interfaces:**
- Produces: 记录文档中心聚焦阅读改造

- [ ] Step 1: 更新门户变更记录。
- [ ] Step 2: 运行 `npm test`。
- [ ] Step 3: 如需上线，再同步到 VPS 并验证页面。
