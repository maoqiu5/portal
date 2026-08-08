# BrianHub 门户 CHANGELOG

本文件记录门户的登录、用户管理、AI 配置、文档中心、项目导航和部署变更。

## v2026.08.08-1 - 门户统一双语语言中心

- 类型：功能 / 国际化 / SSO
- 范围：登录页 / 项目导航 / 用户配置 / 网关认证协议 / 文档中心
- 内容：
  - 门户新增中文 / English 切换按钮，登录页和登录后页面均可切换。
  - 用户配置新增 `locale`；旧用户自动补齐默认 `en-US`。
  - 新增 `brianhub_locale` Cookie，供前端项目读取当前语言。
  - `/auth/check` 成功时新增 `X-BrianHub-Locale` 响应头，供网关转发给业务项目。
  - 支持 `zh-CN`、`en-US`；未知语言统一回退 `en-US`。
  - 项目导航、用户管理、AI 接口、文档中心框架文字接入门户双语字典；文档正文保持原始语言。
  - 新增 `docs/BRIANHUB_LANGUAGE_STANDARD.md`，作为所有项目接入双语的统一规范。
- 验证：
  - 已新增语言偏好、Cookie、语言头、中文/英文页面和未知语言回退的自动化测试。
  - 已运行门户完整本地测试。

## v2026.08.05-1 - 用户模块权限与 Rail Cost 接入

- 类型：功能 / 权限 / 项目导航
- 范围：用户管理 / 项目导航 / 文档中心
- 内容：
  - 新增 `rail-cost` 项目导航入口，显示名为“境外段铁路成本”，路径为 `/rail-cost`。
  - 用户配置新增 `allowedProjects`，普通用户只显示被授权的项目模块。
  - 用户管理新增“可见模块”勾选和保存能力，管理员可以为普通用户配置可访问模块。
  - 普通用户不再显示“用户管理”“AI 接口”“文档中心”管理入口，文档中心 API 对普通用户返回 403。
  - 文档中心项目清单新增 `/root/apps/rail-cost`。
- 验证：
  - 已按 TDD 增加项目清单、配置存储和服务端权限回归测试。
  - 已运行门户完整本地测试：`projects`、`auth`、`configStore`、`documentStore`、`server`。
- 注意：
  - `rail-cost` 是独立模块，不复用 `rates`。
  - 当前未配置 `rail-cost` 健康检查地址，门户会显示未配置，避免误指向错误服务。

## v2026.07.28-1 - 同步 Git 归档后排除内部计划文档

- 类型：修复 / 文档中心 / 部署同步
- 范围：文档索引 / 文档审计
- 内容：
  - 文档中心扫描时排除 `docs/superpowers/` 内部实施计划目录。
  - 避免本地 Git 归档完整同步到 VPS 后，内部计划文档进入门户正式文档中心。
  - 保留 `docs/README.md`、`docs/PRD.md`、`docs/DEPLOYMENT.md`、`docs/CHANGELOG.md` 和 Engramory 长期记忆展示。
- 验证：
  - 已按 TDD 增加 `documentStore` 回归测试。
  - 已运行 `documentStore` 和 `server` 测试。

## v2026.07.27-4 - 文档中心展示 Engramory 长期记忆

- 类型：功能 / 文档中心
- 范围：文档索引 / 文档浏览 / 项目长期记忆
- 内容：
  - 文档中心纳入各项目 `.engramory-memory/*.md` 文件。
  - Engramory 文档统一显示为“长期记忆”分类，排在正式项目文档之后。
  - 补齐研擎项目的文档中心配置，并同步更新项目总览表中的项目清单。
  - 继续只展示 Markdown 文件，不把 Engramory 作为文档审计必需项。
  - 保持路径穿越、数据目录、日志目录、密钥目录和依赖目录的读取限制。
- 验证：
  - 已按 TDD 增加 `documentStore` 和页面回归测试。
  - 已运行门户完整本地测试：`projects`、`documentProjects`、`auth`、`configStore`、`documentStore`、`server`。
  - 已完成线上同步、容器重建和 `/docs/index` 验证：可看到 `.engramory-memory`、“长期记忆”和 `yanqing`。
  - 已验证线上 `/docs/audit` 返回 200，所有文档项目状态为 `ok`。
- 注意：
  - 本次不修改 Engramory 内容、不写入 Codex 原生 memories、不改变业务项目登录或部署规则。

## v2026.07.27-3 - BrianHub Git 版本管理规范

- 类型：文档 / 运维
- 范围：版本管理 / 新项目接入 / 部署说明
- 内容：
  - 在通用开发规则中新增“本地 Git 仓库 + VPS 裸仓库远端”的版本管理规范。
  - 明确 GitHub 不是 BrianHub 当前必需链路，项目默认推送到 `/root/git/<project>.git`。
  - 在新项目文档要求和接入提示词中补充 Git 初始化、VPS 裸仓库、`.gitignore` 和安全验证要求。
  - 在门户部署说明中记录本地仓库、远端 `vps`、VPS 裸仓库路径和“push 不自动部署”的边界。
- 验证：
  - 已运行门户本地测试：`projects`、`documentProjects`、`auth`、`configStore`、`documentStore`、`server`。
  - 已扫描本次修改文档的敏感内容，未发现真实密码、API Key、内部令牌或生产配置值。
- 注意：
  - 本次只改文档，不修改业务代码、不重启容器、不改变部署流程。

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
## v2026.08.08-2 - 门户通知接口配置中心

- 类型：功能 / 配置中心 / 企业微信
- 范围：通知接口页 / 配置存储 / 内部接口 / 网关路由
- 内容：
  - 门户新增管理员可见的 `通知接口` 模块，与 `AI 接口` 平级。
  - 支持统一维护企业微信应用参数：启用状态、应用名称、企业 ID、AgentId、Secret、touser、toparty、totag、Webhook 地址和 Markdown 模板。
  - 企业微信 Secret 只在服务端保存，页面脱敏展示；保存时 Secret 留空会保留旧值。
  - 新增内部接口 `GET /internal/notification-config`，业务项目需携带 `X-Internal-Token` 读取。
  - 普通用户不显示通知接口入口，直接访问或提交会回到项目导航并提示无权限。
- 验证：
  - 已新增配置存储和服务端回归测试，覆盖保存、脱敏、内部读取和普通用户隔离。
