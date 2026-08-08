# BrianHub 网关、SSO 和 AI 配置规则

## 网关规则

- `brianhub-gateway` 是唯一对外 80/443 入口。
- 业务项目不得单独启动公网 Caddy/Nginx 占用 80/443。
- 所有项目加入共享 Docker 网络 `brianhub_edge`。
- 新增项目、修改路径、修改反向代理目标时才修改网关 Caddyfile。
- 修改网关后必须执行 Caddy validate 和 reload。

## SSO 规则

- 用户登录由门户统一处理。
- 业务项目不再维护独立登录页面和独立账户密码。
- 网关通过门户 `/auth/check` 做转发鉴权。
- 登录后的用户身份通过网关或内部约定传给业务项目。
- 门户认证成功时还会返回 `X-BrianHub-Locale`；网关必须将该语言头转发给业务项目。
- 统一语言规则见 `BRIANHUB_LANGUAGE_STANDARD.md`。
- 退出登录必须回到门户，不应自动跳回某个业务项目。

## AI 配置规则

- AI API Base URL、API Key、默认模型、超时、分析上限由门户 `AI 接口` 模块统一维护。
- 业务项目通过门户内部接口 `/internal/ai-config` 读取配置。
- 内部读取必须携带 `X-Internal-Token`。
- API Key 不写入前端页面、URL、日志、文档和测试输出。
- 项目内旧的 AI 配置 UI 和旧环境变量应逐步删除或标记废弃。

## 文档规则

- 网关和 SSO 的主规则写在本文件。
- 业务项目如需引用，只在自己的 `docs/README.md` 或 DEPLOYMENT 中链接本文件。
- 不在多个项目复制维护同一套跨项目规则正文。

## 通知接口配置规则

- 企业微信应用通知参数由门户登录后的 `通知接口` 模块统一维护，仅管理员可见。
- 统一字段包括启用状态、应用名称、企业 ID、AgentId、Secret、touser、toparty、totag、Webhook 地址和 Markdown 模板。
- 业务项目通过门户内部接口 `/internal/notification-config` 读取配置。
- 内部读取必须携带 `X-Internal-Token`。
- 企业微信 Secret 只在服务端保存，页面只显示脱敏值，不写入前端页面、URL、日志、文档和测试输出。
- 项目内旧的企业微信通知配置 UI、Secret 环境变量或重复配置应逐步删除或标记废弃。
