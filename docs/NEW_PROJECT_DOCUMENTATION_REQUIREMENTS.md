# BrianHub 新项目文档要求

## 用途

本文档给 BrianHub 新项目使用。任何新项目接入 `brianhub.net` 前，必须按本规范建立项目文档，确保后续开发、部署、交接、回滚和门户文档中心浏览都有统一入口。

## 必须提供的文档

新项目上线前，项目目录下至少包含：

```text
docs/
  README.md
  PRD.md
  DEPLOYMENT.md
  CHANGELOG.md
```

如果项目涉及复杂运维、AI、数据采集、外部 API、批处理或长期任务，还应补充：

```text
docs/
  HANDOFF.md
  runbooks/
  reports/
  specs/
  plans/
  archive/
```

## 核心文档职责

### `docs/README.md`

文档总入口，必须让新接手的人 1 分钟内知道该读哪些文档。

必须包含：
- 项目一句话说明。
- 当前有效文档列表。
- 部署和运维文档入口。
- 历史文档和归档说明。
- 跨项目规则链接。
- 文档维护规则。

### `docs/PRD.md`

当前产品状态说明，不写成愿望清单。

必须包含：
- 项目目标。
- 当前用户和使用场景。
- 已实现功能。
- 未实现或明确不做的范围。
- 关键数据来源。
- 数据存储位置。
- 核心接口或页面。
- 当前限制和风险。
- 下一步路线图。

### `docs/DEPLOYMENT.md`

线上部署和回滚说明。

必须包含：
- 线上访问路径，例如 `/demo`。
- VPS 项目目录，例如 `/root/apps/demo`。
- Docker compose 文件。
- 服务名、容器名、端口和网络。
- 环境变量清单，只写变量名和用途，不写真实值。
- 数据目录和备份目录。
- 发布命令。
- 回滚方式。
- 健康检查方式。
- 网关路由要求。
- 版本管理方式：本地 Git 仓库、VPS 裸仓库路径、远端名和是否自动部署。
- `.gitignore` 保护范围：生产环境文件、数据库、依赖目录、运行数据、日志、备份、密钥和 Codex 临时目录。

### `docs/CHANGELOG.md`

正式变更记录。

必须包含：
- 日期。
- 变更类型：新增、修复、优化、部署、文档。
- 变更摘要。
- 影响范围。
- 验证方式。

不要把排查过程、临时命令、长日志写入 `CHANGELOG.md`。过程记录放入 `docs/reports/`。

### `docs/HANDOFF.md`

接手上下文，适合给新的 AI 会话或新开发者快速阅读。

建议包含：
- 当前项目状态。
- 最近完成的工作。
- 当前阻塞或风险。
- 关键文件路径。
- 常用命令。
- 不要触碰的敏感区域。

## 可选目录规则

### `docs/runbooks/`

运维手册。适合放定时任务、采集任务、人工补数、重建索引、恢复服务等操作说明。

### `docs/reports/`

阶段报告和验证记录。适合放一次性排查、上线验证、数据校验、性能观察。

### `docs/specs/`

设计文档。记录为什么这么设计、方案取舍和接口边界。

### `docs/plans/`

实施计划。记录开发步骤、测试步骤、部署步骤。

### `docs/archive/`

历史文档。旧方案、旧入口、废弃说明放这里，不继续追加新内容。

## 命名规则

- 常驻核心文档使用固定英文文件名：`README.md`、`PRD.md`、`DEPLOYMENT.md`、`CHANGELOG.md`、`HANDOFF.md`。
- 专题文档使用日期加主题：`2026-07-24-demo-import-report.md`。
- 文件名优先使用小写英文、数字和短横线。
- 文档标题可以使用中文。
- 不使用空格作为文件名分隔符。

## 内容语言

- 正式说明使用中文。
- 命令、路径、接口名、环境变量名、代码标识保留英文原文。
- 不写真实密码、内部令牌、API Key、Cookie、私钥。
- 如果必须说明敏感配置，只写变量名、用途和保存位置。

## BrianHub 接入必写内容

新项目如果接入 BrianHub，`DEPLOYMENT.md` 必须写清：

- 项目 slug，例如 `demo`。
- 前端路径，例如 `https://brianhub.net/<slug>`。
- API 路径，例如 `https://brianhub.net/<slug>/api/*`。
- VPS 目录，例如 `/root/apps/<project-dir>`。
- 数据目录，例如 `/root/apps/<project-dir>/data/<slug>`。
- Docker 网络：`brianhub_edge`。
- 是否需要健康检查 URL。
- 是否需要从门户读取 AI 配置。
- 是否完全移除项目内独立登录。
- VPS 裸仓库路径，例如 `/root/git/<project>.git`。
- 本地 Git 远端名，默认 `vps`。
- `git push` 是否只做版本管理；如有自动部署 hook，必须写清触发条件和回滚方式。

## SSO 要求

接入门户统一登录的项目必须遵守：

- 不再新增项目内独立用户系统。
- 不再新增项目内登录页。
- 所有页面入口由网关通过门户 `/auth/check` 保护。
- 退出登录回到门户。
- 如果项目需要知道当前用户，通过网关传入的身份头或后端约定读取。

## AI 配置要求

如果项目使用 AI API：

- API Base URL、API Key、模型、超时、分析上限从门户 `AI 接口` 模块读取。
- 项目不得在前端保存 API Key。
- 项目不得新增独立 AI Key 配置页面。
- 后端通过门户内部接口 `/internal/ai-config` 获取配置。
- 内部请求必须使用 `X-Internal-Token`。

## 数据和备份要求

新项目必须明确：

- 数据是否持久化。
- 数据库路径。
- 上传文件或生成文件路径。
- 备份目录。
- 哪些目录不得提交 Git。
- 哪些目录不得进入门户文档中心。

默认不得提交 Git 的目录和文件：

- `node_modules/`
- `.pnpm-store/`
- `.codex/`
- `.codex-*/`
- `.work/`
- `data/`
- `logs/`
- `runtime/`
- `backups/`
- `secrets/`
- `.env`
- `.env.*`
- `*.sqlite`
- `*.sqlite-shm`
- `*.sqlite-wal`
- `*.bak`
- `*.backup-*`
- `*.pre-*`

允许提交 `.env.production.example` 等不含真实值的配置样例。

默认不进入文档中心的目录：

- `node_modules/`
- `.venv/`
- `.git/`
- `.pytest_cache/`
- `.pnpm-store/`
- `backups/`
- `data/`
- `runtime/`
- `logs/`
- `report-source/`
- `secrets/`
- 以 `._` 开头的文件

## `docs/README.md` 模板

```markdown
# <项目名> 文档入口

## 项目说明

<一句话说明项目用途。>

## 当前有效文档

- [产品说明](./PRD.md)
- [部署说明](./DEPLOYMENT.md)
- [变更记录](./CHANGELOG.md)

## 运维和报告

- [运行手册](./runbooks/<文件名>.md)
- [验证报告](./reports/<文件名>.md)

## 跨项目规则

- 文档标准：`/root/apps/portal/docs/DOCUMENTATION_STANDARD.md`
- 新项目文档要求：`/root/apps/portal/docs/NEW_PROJECT_DOCUMENTATION_REQUIREMENTS.md`
- 网关、SSO 和 AI 配置规则：`/root/apps/portal/docs/BRIANHUB_GATEWAY_AND_SSO.md`

## 维护规则

- 修改产品边界时更新 `PRD.md`。
- 修改部署、网关、环境变量时更新 `DEPLOYMENT.md`。
- 正式变更写入 `CHANGELOG.md`。
- 过程记录放入 `docs/reports/`。
- 不记录真实密码、内部令牌或 API Key。
```

## `docs/CHANGELOG.md` 模板

```markdown
# <项目名> 变更记录

## 2026-07-24

类型：新增
摘要：
- 新增 <功能或模块>。

影响范围：
- <页面、接口、任务、数据表或部署项>。

验证：
- <测试命令或线上验证方式>。
```

## 新项目上线前检查清单

- [ ] 已创建 `docs/README.md`。
- [ ] 已创建 `docs/PRD.md`。
- [ ] 已创建 `docs/DEPLOYMENT.md`。
- [ ] 已创建 `docs/CHANGELOG.md`。
- [ ] 已说明项目 slug、线上路径、API 路径。
- [ ] 已说明 VPS 目录、数据目录、备份目录。
- [ ] 已说明 Docker 服务、端口和网络。
- [ ] 已说明是否接入门户 SSO。
- [ ] 已说明是否读取门户 AI 配置。
- [ ] 已说明健康检查方式。
- [ ] 文档中没有真实密码、内部令牌或 API Key。
- [ ] 门户文档中心可以看到项目 `docs/README.md`。

## 验收标准

新项目只有在满足以下条件后，才算完成 BrianHub 文档准入：

- 从门户文档中心能看到该项目。
- 该项目至少有 README、PRD、DEPLOYMENT、CHANGELOG 四份核心文档。
- 新接手的人只读 `docs/README.md` 就能找到下一步该看的文档。
- 部署人员只读 `docs/DEPLOYMENT.md` 就能完成发布、验证和回滚。
- 文档没有泄露任何真实密钥。
