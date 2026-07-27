# BrianHub 通用开发规则

## 目标

本文档是 BrianHub 所有项目的统一开发、部署和上线规则。新项目创建、旧项目改造、AI 会话接管、VPS 部署和文档归档都以本文档为准。

适用项目：
- 门户：`portal`
- 网关：`brianhub-gateway`
- 美股：`us-stock-cockpit`
- A 股：`cnstock`
- 邮件工作台：`maildesk`
- GPS 工具：`gps`
- 翻译助手：`translator`
- 后续接入 `brianhub.net` 的所有新项目

## 总原则

- 门户负责统一登录、用户管理、AI API 配置和跨项目文档入口。
- 网关负责路由、统一登录拦截、静态入口转发和服务反向代理。
- 业务项目只负责自己的业务能力，不重复建设门户已有能力。
- 所有项目默认中文界面、中文文档；命令、路径、接口名、环境变量名保留英文原文。
- 不在代码、文档、日志、页面或接口返回中暴露真实密码、API Key、Cookie、内部令牌或私钥。

## 标准目录结构

每个项目建议保持如下结构：

```text
<project>/
  src/ 或 app/
  public/ 或 static/
  docs/
    README.md
    PRD.md
    DEPLOYMENT.md
    CHANGELOG.md
    HANDOFF.md
    runbooks/
    reports/
    specs/
    plans/
    archive/
  test/ 或 tests/
  data/
  backups/
  logs/
  docker-compose.prod.yml
  Dockerfile
  .env 或 .env.production
```

说明：
- `docs/` 存放正式文档和归档说明。
- `data/` 存放持久化业务数据，不进入文档中心，不提交 Git。
- `backups/` 存放备份文件，不进入文档中心，不提交 Git。
- `logs/` 存放运行日志，不进入文档中心，不提交 Git。
- `reports/` 只放整理后的阶段报告，不放大段原始日志。

## 文档规则

每个项目上线前必须提供：
- `docs/README.md`
- `docs/PRD.md`
- `docs/DEPLOYMENT.md`
- `docs/CHANGELOG.md`

复杂项目建议提供：
- `docs/HANDOFF.md`
- `docs/runbooks/`
- `docs/reports/`
- `docs/specs/`
- `docs/plans/`
- `docs/archive/`

文档写法：
- `README.md` 是文档入口，不写成流水账。
- `PRD.md` 描述当前产品边界，不写成愿望清单。
- `DEPLOYMENT.md` 描述线上部署、回滚、健康检查和数据目录。
- `CHANGELOG.md` 只记录正式变更，不记录临时排查过程。
- 过程记录放入 `docs/reports/`，过期内容归档到 `docs/archive/`。

文档中心排除目录：
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

## 登录和 SSO 规则

所有接入 BrianHub 的业务项目默认使用门户统一登录：
- 不新增项目内独立登录页。
- 不新增项目内独立用户管理模块。
- 网关通过门户 `/auth/check` 保护项目入口。
- 门户登录成功后，用户再进入具体项目。
- 项目退出登录统一回到门户。
- 如果项目需要当前用户身份，由网关或后端约定传入用户信息。

例外情况必须写入该项目 `docs/DEPLOYMENT.md` 和 `docs/PRD.md`，说明为什么不能接入统一登录。

## AI API 配置规则

所有项目使用 AI API 时，统一从门户读取配置：
- API Base URL
- API Key
- 默认模型
- 超时秒数
- 分析上限

项目规则：
- 不在前端保存 API Key。
- 不在业务项目里新增独立 AI Key 配置页。
- 后端通过门户内部接口 `/internal/ai-config` 获取配置。
- 内部请求必须使用 `X-Internal-Token`。
- 文档中只能写变量名和用途，不写真实值。

## 数据库和数据边界

每个项目必须在 `docs/DEPLOYMENT.md` 写清数据边界：
- 是否使用数据库。
- 数据库类型，例如 SQLite、PostgreSQL、MySQL。
- 数据库文件或连接配置的保存位置。
- 上传文件、生成文件、缓存文件的保存位置。
- 备份目录。
- 哪些数据可删除，哪些数据必须保留。

推荐规则：
- SQLite 文件放在项目自己的 `data/` 下。
- 上传文件放在项目自己的 `data/uploads/` 或类似目录。
- 生成文件放在 `data/generated/` 或 `runtime/`。
- 临时缓存可以放在 `runtime/`，但必须可重建。
- 跨项目共享数据必须先形成接口或文档说明，不直接读写其他项目数据库。

禁止事项：
- 业务项目直接修改门户用户配置。
- 业务项目直接读取其他项目数据库，除非有明确只读约定和文档说明。
- 把数据库文件、备份文件、上传文件提交到 Git。
- 把真实数据库连接串写进文档。

## 环境变量规则

环境变量必须在 `docs/DEPLOYMENT.md` 中列出：
- 变量名。
- 用途。
- 是否必填。
- 默认值说明。
- 保存位置。

禁止写真实值。示例：

```text
PORTAL_INTERNAL_TOKEN：门户内部接口访问令牌，必填，保存在 VPS 环境变量或 .env.production。
DATABASE_PATH：SQLite 数据库路径，必填，默认位于 /root/apps/<project>/data/。
```

## Docker 和网络规则

线上项目默认使用 Docker 或 Docker Compose 管理。

每个项目必须说明：
- `Dockerfile` 位置。
- `docker-compose.prod.yml` 位置。
- 服务名。
- 容器名。
- 内部端口。
- 对外路径。
- 所属 Docker 网络。
- 健康检查方式。

BrianHub 统一网络：

```text
brianhub_edge
```

除非有明确原因，不直接暴露业务项目公网端口。公网入口由网关统一转发。

## 网关路由规则

所有线上路径统一挂在 `https://brianhub.net` 下：

```text
/usstock
/cnstock
/maildesk
/gps
/translator
```

新项目接入时，必须在 `docs/DEPLOYMENT.md` 写清：
- 项目 slug。
- 页面路径。
- API 路径。
- 网关配置位置。
- 是否需要 `/auth/check` 保护。
- 是否需要特殊 websocket、上传大小、超时配置。

默认要求：
- 页面入口需要登录保护。
- API 是否保护由项目业务决定，但必须写清。
- 静态资源路径不能和其他项目冲突。

## 上线流程

标准上线步骤：

1. 本地确认代码和文档已更新。
2. 运行项目测试。
3. 检查文档中没有真实密钥。
4. 同步代码到 VPS 项目目录。
5. 在 VPS 运行测试或构建检查。
6. 执行 Docker Compose 构建和启动。
7. 检查容器状态。
8. 检查健康接口。
9. 检查门户入口和项目页面。
10. 更新 `docs/CHANGELOG.md`。

示例命令：

```bash
cd /root/apps/<project>
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100
```

## 回滚流程

每个项目必须具备可执行回滚方式，并写入 `docs/DEPLOYMENT.md`。

最低要求：
- 知道上一版代码或备份位置。
- 知道如何恢复环境变量。
- 知道如何恢复数据库或数据目录。
- 知道如何重启容器。
- 知道如何验证回滚成功。

通用回滚步骤：

1. 停止当前容器或切回上一版镜像。
2. 恢复上一版配置。
3. 如涉及数据变更，恢复备份或执行反向迁移。
4. 重新启动服务。
5. 验证健康检查和关键页面。
6. 在 `docs/reports/` 记录原因和结果。

## 健康检查规则

每个项目建议提供健康检查接口：

```text
/health
```

健康检查至少返回：

```json
{ "status": "ok" }
```

如果项目没有健康检查，必须在 `docs/DEPLOYMENT.md` 写明替代验证方式。

门户项目卡片里的健康状态应优先使用健康接口，不用人工判断。

## 备份规则

必须备份：
- 数据库。
- 上传文件。
- 关键配置文件。
- 生成但不可重建的重要文件。

不需要备份：
- `node_modules/`
- 构建产物中可重建的文件。
- 临时缓存。
- 日志原文，除非用于事故追踪。

备份文档必须写清：
- 备份位置。
- 备份频率。
- 恢复方式。
- 最近一次验证恢复的时间。

## 日志和运行产物

日志原则：
- 日志用于排查，不用于长期业务存储。
- 日志不得输出真实密码、API Key、Cookie、内部令牌。
- 大日志不写入 Markdown 文档。
- 重要排查结论整理后写入 `docs/reports/`。

运行产物原则：
- 可重建产物放 `runtime/` 或构建目录。
- 用户数据放 `data/`。
- 备份放 `backups/`。
- 文档中心不展示这些目录。

## 安全规则

禁止：
- 在文档中写真实密码。
- 在文档中写完整 API Key。
- 在页面中展示完整 API Key。
- 在日志中输出认证头、Cookie、内部令牌。
- 把 `.env`、数据库、备份包提交到 Git。

允许：
- 写变量名。
- 写脱敏值，例如 `sk-***abcd`。
- 写保存位置和配置方式。
- 写检查方法。

## Codex 会话接管规则

如果需要根据历史 Codex 对话整理项目：

1. 用户提供项目名和 Codex 对话 ID。
2. 先读取对话，提取有效结论、部署记录、风险点和未完成事项。
3. 再读取 VPS 项目文档，和对话内容对照。
4. 明确分类为：
   - 直接修复：乱码、重复链接、明显过期路径、格式错误。
   - 建议确认：删除大段历史文档、调整产品边界、修改部署策略。
   - 暂不处理：无法从对话或 VPS 验证的信息。
5. 修改后更新该项目 `docs/README.md` 和 `docs/CHANGELOG.md`。

不要只凭记忆或单段对话重写项目文档。

## 新项目上线检查清单

- [ ] 已创建核心文档。
- [ ] 已接入或明确说明不接入门户 SSO。
- [ ] 已说明是否使用门户 AI 配置。
- [ ] 已说明数据库和数据目录。
- [ ] 已说明备份目录和恢复方式。
- [ ] 已说明 Docker 服务、端口、网络和健康检查。
- [ ] 已说明网关路由。
- [ ] 已运行测试或写明人工验证方式。
- [ ] 已确认文档、日志、页面不暴露真实密钥。
- [ ] 已能从门户文档中心浏览项目文档。

## 变更维护

以下情况必须更新文档：
- 新增或移除页面入口。
- 修改网关路由。
- 修改登录方式。
- 修改 AI API 配置方式。
- 修改数据库位置或数据结构。
- 修改部署命令。
- 修改回滚方式。
- 新增定时任务或后台任务。
- 修复重大线上问题。

文档和代码同样是交付物。没有文档的上线，视为未完成上线。
