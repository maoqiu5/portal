# BrianHub 门户用户与 AI 配置中心实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 在门户登录后增加用户管理和 AI 接口模块，并提供项目后续读取 AI API 参数的内部接口。

**架构：** 门户继续使用 Express，新增本地 JSON 配置存储。用户密码保存哈希；AI API Key 只在服务端保存，页面只显示是否已配置和掩码。项目后续通过 Gateway 保护的内部接口读取配置。

**技术栈：** Node.js、Express、cookie-parser、node:test、supertest、本地 JSON 文件。

## 全局约束

- 文档使用中文。
- 不在文档或输出中展开真实密码、真实 API Key。
- 第一阶段只实现门户配置中心和内部接口，不改 translator/maildesk 实际调用。
- 配置文件默认位置为 `/app/data/portal-config.json`，本地开发可通过 `PORTAL_CONFIG_PATH` 覆盖。
- 前端页面避免复杂框架，沿用现有服务端渲染 HTML。

---

## 文件结构

- `src/configStore.js`：负责读取、初始化、保存门户用户和 AI 配置。
- `src/auth.js`：增加密码哈希与校验函数。
- `src/server.js`：从配置存储读取用户、处理用户管理表单、AI 配置表单和内部读取接口。
- `src/render.js`：渲染登录后门户、用户管理、AI 接口模块。
- `public/styles.css`：补充 tab、表格、表单和状态样式。
- `test/configStore.test.js`：覆盖配置初始化、用户密码、AI Key 掩码与保留。
- `test/server.test.js`：覆盖多用户登录、用户管理、AI 配置保存、内部接口。

## 任务

### Task 1：配置存储与密码哈希

- [ ] 写 `configStore` 和 `auth` 的失败测试。
- [ ] 实现 JSON 配置初始化：默认管理员来自 env。
- [ ] 实现用户新增、禁用、重置密码。
- [ ] 实现 AI 配置读取、保存和 API Key 保留。
- [ ] 跑测试确认通过。

### Task 2：门户路由与内部接口

- [ ] 写 server 失败测试：多用户登录、用户管理 POST、AI 配置 POST、内部 AI 配置读取。
- [ ] 改 `server.js` 使用配置存储验证用户。
- [ ] 新增 `/users`、`/users/create`、`/users/:username/password`、`/users/:username/status`。
- [ ] 新增 `/ai-config` 和 `/internal/ai-config`。
- [ ] 跑测试确认通过。

### Task 3：登录后界面

- [ ] 改 `renderPortalPage` 支持 `tab=projects/users/ai`。
- [ ] 增加用户管理表格和 AI 接口配置表单。
- [ ] 更新 CSS。
- [ ] 跑测试确认页面包含新模块。

### Task 4：部署准备

- [ ] 更新 Docker compose，挂载 `./data:/app/data`。
- [ ] 本地全量测试。
- [ ] 部署前备份 VPS 的 portal 源码和配置。
- [ ] 上传、构建、重启 portal。
- [ ] 线上验证登录、用户管理页面、AI 配置页面和内部接口。
## 第二阶段：translator 接入门户 AI 配置

日期：2026-07-24

已完成：
- `translator` 后端新增从门户内部接口读取 AI 配置的逻辑，默认地址为 `http://portal_frontend:3000/internal/ai-config`。
- `translator` 后端读取门户配置时必须携带 `X-Internal-Token`，浏览器提交的 `aiConfig` 已被忽略。
- `translator` 前端已移除项目内 `AI 配置` 面板，不再保存或发送本地 API Key、Base URL、模型参数。
- `translator` 前端启动时会清理旧的 `ai-translation-config` localStorage，避免浏览器残留旧配置。
- portal 和 translator 的生产环境已配置独立的 `PORTAL_INTERNAL_TOKEN`；translator 已配置 `PORTAL_AI_CONFIG_URL`。
- portal 已重启读取新的内部令牌；translator 已重新构建并重启。

验证记录：
- 在 VPS 容器内运行 `pnpm test`：5 个测试文件、34 个测试全部通过。
- translator 构建通过：`tsc && vite build` 成功。
- 登录门户后访问 `https://brianhub.net/translator/` 返回 200。
- translator 构建产物和源码中未发现 `ai-translation-config` 或 `API Key` 项目内配置残留。
- 从 translator 容器内部访问门户 `/internal/ai-config` 返回 200，配置为启用状态，且存在 API Key、Base URL、模型字段。
- 线上调用 `https://brianhub.net/translator/api/translate` 返回 200，并返回 detectedDirection、direct、polished 字段。

注意：
- 文档、日志和输出中不记录真实密码、内部令牌或 AI API Key。
- translator `.env.production` 中旧的 `OPENAI_API_KEY`、`OPENAI_MODEL`、`OPENAI_BASE_URL` 暂未删除，但当前代码路径已经不再读取这些旧变量作为翻译配置来源。

下一步：
- 按同样模式改造 `maildesk` 的 AI API 参数读取逻辑，让 maildesk 后续也只从门户 `/internal/ai-config` 获取 AI 配置。

## 门户交互与中文化优化

日期：2026-07-24

已完成：
- 门户登录页、导航页、用户管理页、AI 接口页的主要显示文字统一改为中文。
- 登录失败提示改为中文：`用户名或密码错误`。
- 用户新增、用户启停、密码重置、AI 接口配置保存这些提交成功后，会跳回对应页面并显示弹窗。
- 提交失败时，会跳回对应页面并显示失败弹窗。
- 弹窗支持点击 `知道了` 关闭。
- 初始登录页面新增全屏背景图，并保留半透明登录面板，提升首屏视觉效果。
- 项目卡片名称和描述改为中文，包括美股、A 股、邮件工作台、GPS 工具、翻译助手。

验证记录：
- 本地 `pnpm test` 通过：25 个测试全部通过。
- VPS 容器内 `node test/server.test.js` 通过：17 个测试全部通过。
- 线上验证通过：登录页包含中文标题和背景层；登录后首页包含中文项目名和中文退出按钮；带 `message` 参数访问门户会显示弹窗和 `知道了` 按钮。

## 第三阶段：maildesk 接入门户 AI 配置

日期：2026-07-24

已完成：
- `maildesk` 后端主 AI 分析脚本 `scripts/vps_wps_collect.py` 新增门户 AI 配置读取逻辑。
- 默认读取地址为 `http://portal_frontend:3000/internal/ai-config`，请求必须携带 `X-Internal-Token`。
- maildesk 的 AI API Key、Base URL、模型、分析上限、超时参数会从门户 AI 接口配置中心读取。
- 门户 AI 配置为关闭时，maildesk LLM 分析会同步关闭。
- 邮件发送分析入口不再用 maildesk 自己的模型设置覆盖门户模型。
- maildesk `.env.production` 已新增 `PORTAL_AI_CONFIG_URL` 和 `PORTAL_INTERNAL_TOKEN`。
- 修复 `docker-compose.prod.yml` 中 `APP_PASSWORD: ${APP_PASSWORD}` 在宿主未加载变量时覆盖为空的问题；现在 `APP_PASSWORD` 从 `.env.production` 进入容器，`CORS_ALLOW_ORIGINS` 明确为 `https://brianhub.net`。
- 已清空 maildesk 当前环境文件和历史环境备份中的旧 `OPENAI_API_KEY`、`OPENAI_MODEL`、`OPENAI_BASE_URL` 值，避免 maildesk 继续保存 AI 参数副本。
- `backend/scripts/audit_business_type_with_llm.py` 审计脚本也已改为优先读取门户 AI 配置，避免手动审计任务绕过门户配置中心。
- 已重建并重启 maildesk backend。

验证记录：
- 本地执行 `scripts/test_portal_ai_config.py` 通过。
- VPS 容器执行 `python scripts/test_portal_ai_config.py` 通过。
- maildesk backend 容器内验证：门户 AI 配置读取成功，LLM 启用，API Key、Base URL、模型、分析上限、超时均可读取；`APP_PASSWORD`、`PUBLIC_URL`、`CORS_ALLOW_ORIGINS` 均存在。
- 清空旧 `OPENAI_*` 后再次验证：容器环境中的旧 `OPENAI_API_KEY` 不存在，maildesk 仍可从门户读取 AI Key、Base URL、模型。
- VPS 容器执行 `python backend/scripts/test_audit_portal_ai_config.py` 通过。
- 审计脚本更新后重建 maildesk backend，线上 `/maildesk`、`/maildesk/api/auth/me`、`/maildesk/api/dashboard` 均返回 200。
- 线上登录后访问 `https://brianhub.net/maildesk` 返回 200。
- 线上 `https://brianhub.net/maildesk/api/auth/me` 返回 200。
- 线上 `https://brianhub.net/maildesk/api/dashboard` 返回 200。

注意：
- 文档、日志和输出中不记录真实密码、内部令牌或 AI API Key。
- maildesk `.env.production` 中旧的 `OPENAI_API_KEY`、`OPENAI_MODEL`、`OPENAI_BASE_URL` 暂未删除，但当前 AI 调用层会优先使用门户配置覆盖这些旧变量。

## 第四阶段：门户 AI 测试连接与项目健康状态

日期：2026-07-24

已完成：
- 门户 AI 接口页面新增 `测试连接` 按钮，提交到 `/ai-config/test`。
- 测试连接会使用页面当前参数，并在 API Key 留空时沿用已保存的 Key；真实 Key 不会写入跳转地址、页面或测试输出。
- 门户新增登录后可访问的 `/health/projects` JSON 接口，统一返回各项目健康检查状态。
- 项目配置新增健康检查地址，首页项目卡片显示 `正常`、`异常`、`未配置`、`未检测` 状态徽章。
- 门户渲染文件和项目配置文件整理为正常 UTF-8 中文，修复本地文件中的乱码显示问题。
- 样式新增健康状态徽章，保持项目卡片布局稳定。

验证记录：
- 本地执行 `pnpm test` 通过：认证 4 个、配置存储 4 个、服务端 22 个测试全部通过。
- 新增测试覆盖 `/ai-config/test` 成功和失败分支、API Key 不泄露、`/health/projects` JSON 返回，以及首页健康徽章渲染。

待部署验证：
- VPS 同步门户改动后执行容器内测试。
- Gateway 增加 `/ai-config/test` 和 `/health/projects` 的反向代理规则。
- 线上登录后验证 AI 测试连接按钮、项目健康徽章和 `/health/projects` 接口。
