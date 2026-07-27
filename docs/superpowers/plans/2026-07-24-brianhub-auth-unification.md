# BrianHub 五项目统一本地登录记录

日期：2026-07-24

## 背景

BrianHub 门户已经上线到 `https://brianhub.net/`，根路径用于统一导航。当前阶段先把五个项目的本地登录账号统一，减少多套账号带来的混乱。

这一步不是最终 SSO。用户仍可能在进入项目后看到项目自己的登录页，但所有项目都改为同一套账号。

## 统一账号

- 用户名：`brian`
- 密码：沿用用户指定的统一密码，不在文档中展开记录。

用户名一律使用小写 `brian`。不再使用大写 `Brian` 作为登录账号。

## 已实施项目

- `usstock`：在原有仅密码登录前增加用户名校验，要求用户名为 `brian`。
- `cnstock`：在原有仅密码登录前增加用户名校验，要求用户名为 `brian`。
- `maildesk`：把原有 `admin` 默认账号统一为 `brian`，并迁移数据库中的管理员账号归属。
- `gps`：为静态页面增加本地登录门禁，要求用户名为 `brian`。
- `translator`：为 React 应用增加本地登录门禁，要求用户名为 `brian`。

## 服务器文件

- `/root/apps/us-stock-cockpit/app/page.tsx`
- `/root/apps/cnstock/app/page.tsx`
- `/root/apps/maildesk/app/page.tsx`
- `/root/apps/maildesk/backend/app/main.py`
- `/root/apps/gps/web/index.html`
- `/root/apps/translator/src/App.tsx`
- `/root/apps/portal/.env.production`

## 备份

本次项目认证改造前，服务器上已创建带时间戳 `20260724-032549` 的文件备份。

Maildesk 数据库备份：

```text
/root/apps/maildesk/data/maildesk/maildesk.db.bak-auth-20260724-032549
```

门户网关切换备份：

```text
/root/apps/brianhub-gateway/Caddyfile.backup-portal-20260724-0248
```

## 线上核验记录

- 门户 `.env.production` 中 `PORTAL_USERNAME=brian`。
- 门户容器 `brianhub-portal-portal-1` 正常运行。
- 门户登录接口：小写 `brian` 登录成功并跳转。
- 门户登录接口：大写 `Brian` 返回 401。
- `usstock` 源码要求用户名 `brian`。
- `cnstock` 源码要求用户名 `brian`。
- `gps` 页面包含 `brianhub-gps-auth` 登录状态。
- `translator` 源码包含 `brianhub-translator-auth` 登录状态。
- `maildesk` API 已验证统一账号登录返回管理员用户。

## 后续 SSO 方向

下一阶段再做真正单点登录：

- 用户只在门户登录一次。
- 项目页面不再显示自己的登录页。
- 项目后端或网关统一校验门户会话 Cookie。
- 项目前端不再把应用密码保存在 `localStorage`。

## SSO 样板进展

日期：2026-07-24

已完成 `usstock` 作为第一个 SSO 样板：

- 门户新增 `GET /auth/check`，用于网关校验 `brianhub_session`。
- `/auth/check` 未登录时默认返回 401，供 API 使用。
- `/auth/check?redirect=1` 未登录时返回 302 到 `/?returnTo=<原路径>`，供页面入口使用。
- Gateway 的 `/usstock` 页面路由已接入 `forward_auth`。
- Gateway 的 `/usstock/api/*` API 路由已接入 `forward_auth`。
- Gateway 认证通过后，对美股后端注入内部请求头 `X-BrianHub-SSO: 1`。
- 美股后端继续兼容旧的 `X-App-Password`，同时接受网关注入的 `X-BrianHub-SSO: 1`。
- 美股前端已移除项目自己的用户名/密码登录页。
- 美股前端不再发送 `X-App-Password`，改为依赖浏览器携带门户 Cookie。
- 美股前端会清理旧的 `us-stock-cockpit-username` 和 `us-stock-cockpit-password` localStorage 项。

线上验收记录：

- 未登录访问 `/usstock`：302 跳转到门户登录页。
- 未登录访问 `/usstock/api/dashboard/summary`：401。
- 登录门户后访问 `/usstock`：200。
- 登录门户后访问 `/usstock/api/dashboard/summary`：200。
- 美股前端构建产物不再包含 `请输入 APP_PASSWORD`。
- 美股前端构建产物不再包含 `X-App-Password`。

新增备份：

```text
/root/apps/brianhub-gateway/Caddyfile.backup-sso-usstock-20260724-0527
```

## A 股 SSO 进展

日期：2026-07-24

已完成 `cnstock` 接入同一套 SSO 模式：

- Gateway 的 `/cnstock` 页面路由已接入 `forward_auth`。
- Gateway 的 `/cnstock/api/*` API 路由已接入 `forward_auth`。
- Gateway 认证通过后，对 A 股后端注入内部请求头 `X-BrianHub-SSO: 1`。
- A 股后端继续兼容旧的 `X-App-Password`，同时接受网关注入的 `X-BrianHub-SSO: 1`。
- A 股前端已移除项目自己的用户名/密码登录页。
- A 股前端不再发送 `X-App-Password`，改为依赖浏览器携带门户 Cookie。
- A 股前端会清理旧的 `cnstock-cockpit-username` 和 `cnstock-cockpit-password` localStorage 项。

线上验收记录：

- 未登录访问 `/cnstock`：302 跳转到门户登录页。
- 未登录访问 `/cnstock/api/dashboard/summary`：401。
- 登录门户后访问 `/cnstock`：200。
- 登录门户后访问 `/cnstock/api/dashboard/summary`：200。
- A 股前端构建产物不再包含 `请输入 APP_PASSWORD`。
- A 股前端构建产物不再包含 `X-App-Password`。

新增备份：

```text
/root/apps/cnstock/app/page.tsx.bak-sso-20260724-0537
/root/apps/cnstock/backend/app/main.py.bak-sso-20260724-0537
/root/apps/cnstock/backend/tests/test_a_share_platform.py.bak-sso-20260724-0537
/root/apps/brianhub-gateway/Caddyfile.backup-sso-cnstock-20260724-0544
```

## Translator SSO 进展

日期：2026-07-24

已完成 `translator` 接入门户 SSO：

- Gateway 的 `/translator/` 页面路由已接入 `forward_auth`。
- Gateway 的 `/translator/api/*` API 路由已接入 `forward_auth`。
- Translator 前端已移除项目自己的用户名/密码登录页。
- Translator 前端不再使用 `brianhub-translator-auth` 作为授权门禁。
- Translator 前端请求历史、单词本和翻译 API 时显式使用同站 Cookie。
- Gateway 统一负责未登录拦截；项目服务不再保存本地登录状态。
- 前端仍保留 AI 配置 localStorage，和登录状态无关。

线上验收记录：

- 未登录访问 `/translator/`：302 跳转到门户登录页。
- 未登录访问 `/translator/api/history`：401。
- 登录门户后访问 `/translator/`：200。
- 登录门户后访问 `/translator/api/history`：200。
- Translator 前端构建产物不再包含 `统一登录`。
- Translator 前端构建产物不再包含 `brianhub-translator-auth`。
- Translator 前端构建产物不再包含旧密码。

新增备份：

```text
/root/apps/translator/src/App.tsx.bak-sso-20260724-0555
/root/apps/translator/src/App.test.tsx.bak-sso-20260724-0555
/root/apps/brianhub-gateway/Caddyfile.backup-sso-translator-20260724-0556
```

## GPS SSO 进展

日期：2026-07-24

已完成 `gps` 接入门户 SSO：

- Gateway 的 `/gps/` 页面路由已接入 `forward_auth`，未登录访问会跳转到门户登录页，并保留 `returnTo=/gps/`。
- Gateway 的 `/gps/api/*` 业务 API 路由已接入 `forward_auth`，未登录访问返回 401。
- `/gps/api/health` 保持公开，用于服务健康检查。
- GPS 静态页面不再依赖项目自己的本地密码；页面中已清空旧密码常量。
- GPS 页面实际保护由 Gateway 和门户会话 Cookie 统一承担。

线上验收记录：

- 未登录访问 `/gps/`：302 跳转到门户登录页，回跳地址为 `/gps/`。
- 未登录访问 `/gps/api/trajectory-devices?limit=1`：401。
- 未登录访问 `/gps/api/health`：200。
- 登录门户后访问 `/gps/`：200。
- 登录门户后访问 `/gps/api/trajectory-devices?limit=1`：200。
- 登录门户后访问 `/`：200。
- 登录门户后访问 `/maildesk`：200。
- GPS 页面响应内容不再包含旧密码。

新增备份：

```text
/root/apps/gps/web/index.html.bak-sso-20260724-060307
/root/apps/brianhub-gateway/Caddyfile.backup-sso-gps-20260724-060307
/root/apps/brianhub-gateway/Caddyfile.backup-sso-gps-routefix-20260724-060457
/root/apps/brianhub-gateway/Caddyfile.backup-sso-gps-routeorder-20260724-060600
```

## Maildesk SSO 进展

日期：2026-07-24

已完成 `maildesk` 接入门户 SSO：

- Gateway 的 `/maildesk` 页面入口已接入 `forward_auth`，未登录访问会跳转到门户登录页。
- Gateway 的 `/maildesk/api/*` 已接入 `forward_auth`，未登录访问返回 401。
- Gateway 在门户认证通过后，向 maildesk 后端注入内部 `X-App-Password`，不再要求浏览器保存 maildesk 自己的 token。
- Maildesk 后端运行时 `ADMIN_USERNAME` 已统一为 `brian`，内部授权身份为 `brian/admin`。
- Maildesk 前端默认使用门户 SSO 会话进入 `brian/admin`，并清理旧的 `maildesk-token`、`maildesk-user` 和旧 `admin` 账号 localStorage。
- Maildesk 的 WPS/VNC 子路由已改由门户 SSO 保护，不再使用独立 Basic Auth。
- 用户管理后续由门户统一承担，maildesk 不再作为用户管理入口。

构建与线上验收记录：

- Maildesk frontend 镜像构建通过，Next 编译和 TypeScript 检查通过。
- Caddy 配置校验通过：`Valid configuration`。
- 未登录访问 `/maildesk`：302 跳转到门户登录页。
- 未登录访问 `/maildesk/api/auth/me`：401。
- 未登录访问 `/maildesk/wps-browser/`：302 跳转到门户登录页。
- 登录门户后访问 `/maildesk`：200。
- 登录门户后访问 `/maildesk/api/auth/me`：返回 `brian/admin`。
- 登录门户后访问 `/maildesk/api/dashboard`：200。
- 登录门户后访问 `/maildesk/wps-browser/`：200。
- 登录门户后访问 `/`、`/usstock`、`/cnstock`、`/gps/`、`/translator/`、`/maildesk` 均返回 200。

新增备份：

```text
/root/apps/brianhub-gateway/Caddyfile.backup-sso-maildesk-20260724-061417
/root/apps/brianhub-gateway/.env.production.backup-maildesk-env-20260724-070239
/root/apps/brianhub-gateway/.env.production.backup-maildesk-envfix-20260724-070740
/root/apps/brianhub-gateway/.env.production.backup-maildesk-runtimepass-20260724-070844
/root/apps/brianhub-gateway/.env.production.backup-maildesk-brian-20260724-071444
/root/apps/maildesk/app/page.tsx.bak-sso-portal-20260724-071030
/root/apps/maildesk/.env.production.bak-sso-portal-20260724-071030
/root/apps/maildesk/.env.production.bak-envfix-20260724-071151
```

## Maildesk 退出修复

日期：2026-07-24

问题：

- Maildesk 前端退出按钮会访问 `GET /logout?returnTo=/maildesk`。
- 门户此前只支持 `POST /logout`，所以线上会返回 `Cannot GET /logout`，导致门户 session 没有被清除。

修复：

- 门户新增 `GET /logout`。
- `GET /logout` 会清除 `brianhub_session` Cookie。
- `GET /logout` 支持安全的 `returnTo`，外部地址会被拒绝并回到 `/`。

验证：

- 本地门户测试通过：15 项通过，0 项失败。
- 线上访问 `GET /logout?returnTo=/maildesk` 返回 302 到 `/maildesk`。
- 退出响应头包含 `set-cookie: brianhub_session=; Expires=Thu, 01 Jan 1970 00:00:00 GMT`。
- 退出后再次访问 `/maildesk` 会跳转到门户登录页。

新增备份：

```text
/root/apps/portal/src/server.js.bak-logout-get-20260724-072335
```

## Maildesk 退出后回首页修复

日期：2026-07-24

问题：

- 第一次退出修复中，`GET /logout?returnTo=/maildesk` 会清 Cookie 后跳回 `/maildesk`。
- `/maildesk` 被 Gateway 保护，未登录时会再跳到门户登录页，并保留 `returnTo=/maildesk`。
- 因此用户退出后重新登录，会被自动带回 `maildesk`，而不是停留在门户首页。

修复：

- `GET /logout` 改为忽略 `returnTo`，统一清 Cookie 后跳转到 `/`。
- 这样退出后看到的是门户首页登录页，重新登录后停留在门户导航首页。

验证：

- 本地门户测试通过：12 项通过，0 项失败。
- 线上 `GET /logout?returnTo=/maildesk` 返回 302 到 `/`。
- 退出后的门户登录页不再包含 `returnTo=/maildesk`。
- 重新登录后停留在 `https://brianhub.net/` 门户首页。

新增备份：

```text
/root/apps/portal/src/server.js.bak-logout-root-20260724-072911
```

## 门户用户管理与 AI 接口模块

日期：2026-07-24

已完成第一阶段：

- 门户登录后新增三个模块：`项目导航`、`用户管理`、`AI 接口`。
- 用户管理支持新增用户、启用/禁用用户、重置密码。
- 门户用户保存到 `/root/apps/portal/data/portal-config.json`，容器挂载 `./data:/app/data`，避免重建后丢失。
- 用户密码使用 PBKDF2 哈希保存，不保存明文密码。
- AI 接口配置统一保存到门户配置文件，包含启用状态、Base URL、API Key、默认模型、超时秒数、分析上限。
- AI API Key 只在服务端保存，页面只显示掩码，不明文回显。
- 新增内部接口 `GET /internal/ai-config`，无内部 token 访问返回 401。
- 当前已把 maildesk 现有 AI 配置同步到门户 AI 配置中心。后续 translator、maildesk 的 AI 参数读取将改为从门户内部接口获取。

线上验收记录：

- 登录门户后 `/` 返回 200，并显示 `用户管理` 和 `AI 接口` 模块入口。
- `/users/create` 可创建测试用户，并跳回 `/?tab=users`。
- 测试用户禁用后再次登录返回 401。
- `/ ?tab=ai` 页面返回 200，且不包含 AI API Key 明文。
- 未带内部 token 访问 `/internal/ai-config` 返回 401。
- 登录门户后访问 `/usstock`、`/cnstock`、`/gps/`、`/translator/`、`/maildesk` 均返回 200。

新增备份：

```text
/root/apps/portal/backups/portal-users-ai-20260724-084012/
/root/apps/brianhub-gateway/Caddyfile.backup-portal-users-ai-20260724-084252
```
