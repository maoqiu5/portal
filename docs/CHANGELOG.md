# BrianHub 门户 CHANGELOG

本文件记录门户的登录、用户管理、AI 配置、文档中心、项目导航和部署变更。

## v2026.07.27-2 - 文档中心聚焦阅读

- 类型：功能 / 前端 / 文档
- 范围：文档中心
- 内容：
  - 文档中心新增快速入口，优先访问项目总览、新项目接入、通用开发规则、网关/SSO/AI 规则和文档审计说明。
  - 项目文档列表改为折叠展示，默认只展开当前项目或第一个项目。
  - 项目内优先显示 README、PRD、DEPLOYMENT、CHANGELOG、HANDOFF 等核心文档，专题文档收进“更多文档”。
  - 搜索或分类筛选时自动展开有命中文档的项目。
- 验证：
  - 本地测试：`node test/auth.test.js && node test/configStore.test.js && node test/documentStore.test.js && node test/server.test.js`。
- 注意：
  - 本次不改变文档扫描、审计 API、登录、AI 配置或 gateway 路由。

## v2026.07.27-1 - 恢复 LearnDesk 门户导航

- 类型：修复 / 项目导航
- 范围：src/projects.js / test/projects.test.js
- 内容：
  - 恢复 `learndesk` 项目导航入口，路径为 `/learndesk`。
  - 保留现有项目入口，未覆盖 `yanqing`、`rates` 等后续新增项目。
  - 新增默认项目导航回归测试，防止后续更新再次遗漏 LearnDesk。
- 验证：
  - 通过门户完整测试：`node test/projects.test.js && node test/auth.test.js && node test/configStore.test.js && node test/documentStore.test.js && node test/server.test.js`。
  - 重建并启动门户容器：`docker compose -f docker-compose.prod.yml up -d --build`。
  - 验证 LearnDesk 健康检查：`https://brianhub.net/learndesk/health`。
- 注意：
  - 本次不修改门户登录、AI 配置、网关和 LearnDesk 服务代码。
  - 文档和代码不包含真实密钥、Cookie、内部令牌或私钥。

## v2026.07.25-1 - 文档标准化

- 类型：文档 / 运维
- 范围：docs / 文档中心
- 内容：
  - 新增 `docs/PRD.md`，明确门户作为 BrianHub 统一登录、用户管理、AI 配置、导航和文档中心。
  - 新增 `docs/DEPLOYMENT.md`，记录生产入口、Node/Express 运行方式、Compose 部署、验证和回滚。
  - 新增 `docs/CHANGELOG.md`，作为后续门户功能和运维变更的标准记录入口。
  - 清理历史计划文档中的密钥样式变量示例，避免文档审计误报。
- 验证：
  - 待同步到 VPS 后通过门户 `/docs/audit` 验证。
- 注意：
  - 本次只改文档，不修改门户业务代码，不重启门户容器。
