# Engramory 文档中心展示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 BrianHub 门户文档中心展示各项目 `.engramory-memory` 中的长期记忆 Markdown。

**Architecture:** 继续由 `src/documentStore.js` 作为唯一文档扫描边界，把项目根目录下 `.engramory-memory/*.md` 纳入只读索引，并标记为 `长期记忆` 分类。`src/render.js` 保持现有折叠项目列表和 Markdown 渲染方式，通过分类筛选即可查看 Engramory 内容。

**Tech Stack:** Node.js、Express、原生服务端渲染、Node 内置测试框架。

## Global Constraints

- 页面和显示文案使用中文。
- 不读取或展示数据目录、密钥目录、运行目录、日志目录和依赖目录。
- `.engramory-memory` 只允许展示 Markdown 文件。
- 文档审计不把 Engramory 作为必需文档。
- 不改用户、AI 配置、SSO 或部署链路。

---

### Task 1: 文档索引纳入 Engramory

**Files:**
- Modify: `test/documentStore.test.js`
- Modify: `src/documentStore.js`

**Interfaces:**
- Consumes: `createDocumentStore({ projects })`
- Produces: `listDocuments().projects[].documents[]` 包含 `.engramory-memory/*.md`，分类为 `长期记忆`
- Produces: `getDocument(projectId, '.engramory-memory/MEMORY.md')` 返回 Markdown 内容

- [x] **Step 1: Write the failing test**

在 `test/documentStore.test.js` 增加测试：创建 `.engramory-memory/MEMORY.md`、`.engramory-memory/project-overview.md` 和非 Markdown 文件，断言两个 Markdown 被索引、分类为 `长期记忆`，且可以通过 `getDocument` 读取。

- [x] **Step 2: Run test to verify it fails**

Run: bundled Node 执行 `test/documentStore.test.js`。
Expected: 新测试失败，因为当前 `shouldSkip` 会跳过点号目录。

- [x] **Step 3: Write minimal implementation**

允许 `.engramory-memory` 目录参与 Markdown 扫描；`categoryFor()` 对 `.engramory-memory/*` 返回 `长期记忆`；排序时把 Engramory 放在正式文档之后。

- [x] **Step 4: Run test to verify it passes**

Run: bundled Node 执行 `test/documentStore.test.js`。
Expected: PASS。

### Task 2: 页面展示和回归验证

**Files:**
- Modify: `test/server.test.js`
- Modify: `docs/CHANGELOG.md`

**Interfaces:**
- Consumes: `/?tab=docs`
- Produces: 页面含 `长期记忆` 分类和 `.engramory-memory` 链接

- [x] **Step 1: Write the failing test**

扩展服务端测试的临时项目，增加 `.engramory-memory/MEMORY.md`，断言文档中心页面出现 `长期记忆` 和 `.engramory-memory/MEMORY.md`。

- [x] **Step 2: Run test to verify it fails before implementation**

Run: bundled Node 执行 `test/server.test.js`。
Expected: 在 Task 1 实现前失败。

- [x] **Step 3: Update changelog**

记录文档中心支持 Engramory 长期记忆展示。

- [x] **Step 4: Run full local test suite**

Run: bundled Node 执行所有现有测试文件。
Expected: 全部通过。

### Task 3: 发布同步

**Files:**
- Sync to VPS: `src/documentStore.js`
- Sync to VPS: `src/render.js` if modified
- Sync to VPS: `test/*.js` as needed
- Sync to VPS: `docs/CHANGELOG.md`

**Interfaces:**
- Consumes: VPS `/root/apps/portal`
- Produces: 线上 `https://brianhub.net/?tab=docs` 可以查看各项目长期记忆

- [ ] **Step 1: Commit and push**

提交本地 Git，并推送到 VPS 裸仓库。

- [ ] **Step 2: Sync production files**

同步改动到 `/root/apps/portal`，运行线上测试并重建门户容器。

- [ ] **Step 3: Verify online**

登录后检查 `/docs/index` 或页面内容包含 `.engramory-memory` 和 `长期记忆`。
