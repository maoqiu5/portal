# BrianHub 门户 PRD

更新时间：2026-07-25  
项目代号：`portal`  
生产目录：`/root/apps/portal`

## 1. 产品定位

BrianHub 门户是所有 BrianHub 项目的统一入口和管理中心，负责统一登录、用户管理、AI 接口配置、项目导航、项目健康检查和跨项目文档中心。

门户不直接承载各业务项目的数据处理逻辑。业务系统仍由各自项目维护，门户提供统一身份、统一配置和统一可观察入口。

## 2. 核心能力

- 统一登录和退出。
- 用户管理：创建用户、修改密码、启停账户。
- 项目导航：聚合美股、A 股、邮件工作台、GPS、翻译助手、聚合学习、网关等项目入口。
- SSO 检查：为 gateway 的 `forward_auth` 提供登录校验。
- AI 接口配置：登录后统一维护 Base URL、模型、API Key、超时和分析上限。
- 内部 AI 配置接口：业务项目通过内部令牌读取门户 AI 配置，不在各项目重复保存。
- 文档中心：从 VPS `/root/apps` 读取各项目 Markdown 文档并展示。
- 文档审计：检查必备文档缺失和疑似密钥风险。
- 项目健康：展示项目入口和关键服务状态。

## 3. 用户与权限

当前门户面向 Brian 单人管理使用，默认管理员账号由生产配置初始化。后续可扩展多用户角色，但所有业务项目应以门户会话作为统一身份来源。

权限原则：

- 未登录用户只能访问登录页和必要健康检查。
- 登录用户可以访问项目导航、文档中心、用户管理和 AI 接口配置。
- 内部配置接口只允许携带内部令牌的服务调用。

## 4. 项目边界

门户负责：

- 登录会话和用户配置。
- AI 接口配置的保存、脱敏展示和内部读取。
- 文档索引、文档渲染和文档审计。
- 项目导航、健康概览和统一入口体验。

门户不负责：

- 业务项目数据库迁移。
- 业务模型算法。
- Caddy 路由和 TLS 证书管理。
- 直接修改业务项目生产数据。

## 5. 文档中心规则

- 文档来源以 VPS `/root/apps` 为准。
- 每个项目应提供 `docs/README.md`、`docs/PRD.md`、`docs/DEPLOYMENT.md`、`docs/CHANGELOG.md`。
- 文档中心排除数据、日志、密钥、缓存、依赖和系统阴影文件。
- 文档不得写入真实密码、Token、Cookie、API Key 或可复用认证头。

## 6. 参考文档

- 部署说明：[DEPLOYMENT.md](./DEPLOYMENT.md)
- 变更记录：[CHANGELOG.md](./CHANGELOG.md)
- 通用开发规则：[BRIANHUB_DEVELOPMENT_STANDARD.md](./BRIANHUB_DEVELOPMENT_STANDARD.md)
- 网关、SSO 和 AI 配置规则：[BRIANHUB_GATEWAY_AND_SSO.md](./BRIANHUB_GATEWAY_AND_SSO.md)
- 文档归档规则：[DOCUMENTATION_STANDARD.md](./DOCUMENTATION_STANDARD.md)
