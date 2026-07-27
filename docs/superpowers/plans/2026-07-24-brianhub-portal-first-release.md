# BrianHub 门户第一期实施计划

> **给 agentic workers：** 执行本计划时应使用 `superpowers:subagent-driven-development` 或 `superpowers:executing-plans`，按任务逐项勾选推进。

**目标：** 在 `https://brianhub.net/` 上线第一期 BrianHub 门户，支持用户名+密码登录、退出、五项目导航，并保留所有现有项目路由。

**架构：** 门户是独立 Node/Express 应用，部署到 `/root/apps/portal`。应用服务端渲染登录页和导航页，使用签名 HttpOnly Cookie 保存门户会话，并通过 `brianhub-gateway` 暴露到根路径。第一期不一次性迁移 5 个项目的独立登录，只建立门户和 SSO 基础。

**技术栈：** Node.js 22 Alpine、Express、cookie-parser、Docker Compose、Caddy。

## 全局约束

- `https://brianhub.net/` 改为门户首页。
- `/usstock`、`/cnstock`、`/gps`、`/maildesk`、`/translator` 必须保持可访问。
- `brianhub-gateway` 只做网关，不承载门户业务代码。
- 门户服务器目录为 `/root/apps/portal`。
- 门户数据目录为 `/root/apps/portal/data/portal/`。
- Compose 项目名为 `brianhub-portal`。
- 第一版服务网络别名为 `portal_frontend`。
- 生产 Cookie 必须具备 `HttpOnly`、`Secure`、`SameSite=Lax`、`Path=/`。
- 不提交或打印生产密码、API key、`.env.production`、应用密码文件和项目数据。
- Maildesk VNC 特殊路由必须继续放在 Maildesk catch-all 路由前面。

---

## 文件结构

- `package.json`：Node 依赖和脚本。
- `src/auth.js`：密码校验、会话 token 创建和校验。
- `src/projects.js`：门户项目入口配置。
- `src/render.js`：HTML 转义和页面渲染。
- `src/server.js`：Express 应用、路由、Cookie 和登录流程。
- `public/styles.css`：门户样式。
- `test/auth.test.js`：认证工具单元测试。
- `test/server.test.js`：登录、退出、returnTo 和门户访问测试。
- `Dockerfile`：生产容器镜像。
- `docker-compose.prod.yml`：生产 Compose 服务，加入 `brianhub_edge`。
- `.env.production.example`：环境变量示例，不包含真实密钥。
- `.dockerignore`：避免把测试、文档和生产 env 打进镜像。

---

## 已完成任务

### 任务 1：认证工具

已实现：

- `verifyPassword(inputPassword, expectedPassword)`
- `createSessionToken(secret, nowMs)`
- `verifySessionToken(token, secret, maxAgeMs, nowMs)`

测试覆盖：

- 正确密码通过。
- 错误密码失败。
- 会话 token 可验证。
- 错误 secret、篡改 token、过期 token 都失败。

### 任务 2：门户路由和页面

已实现：

- `GET /health` 返回 `{ "status": "ok" }`。
- `GET /` 未登录显示登录页。
- 登录表单包含用户名和密码。
- `POST /login` 校验用户名和密码。
- 登录成功后设置 `brianhub_session` Cookie。
- `returnTo` 只允许站内路径，防止外跳。
- 登录后 `GET /` 显示五项目导航。
- `POST /logout` 清除 Cookie 并跳回 `/`。

测试覆盖：

- 未登录显示登录页。
- 错误用户名返回 401。
- 错误密码返回 401。
- 正确用户名和密码设置 Cookie 并跳转。
- 外部 `returnTo` 被重写为 `/`。
- 登录后显示导航页和项目入口。
- 退出登录清除会话。

### 任务 3：生产容器配置

已实现：

- `Dockerfile`
- `docker-compose.prod.yml`
- `.env.production.example`
- `.dockerignore`

注意：生产镜像使用 `node:22-alpine`。构建时需要固定 `pnpm@11.9.0`，避免 Corepack 自动拉取不兼容版本。

生产环境变量：

```dotenv
PORTAL_USERNAME=<门户用户名>
PORTAL_PASSWORD=<门户密码>
PORTAL_SESSION_SECRET=<随机会话密钥>
```

### 任务 4：服务器文件上传

已完成：

- 已创建 `/root/apps/portal/data/portal`。
- 已上传门户代码到 `/root/apps/portal`。

已完成：

- 已在服务器写入 `/root/apps/portal/.env.production`。
- 已在服务器构建并启动门户容器。
- 已备份并修改 `/root/apps/brianhub-gateway/Caddyfile`。
- 已把根路径从 `/usstock` 跳转切换为门户反代。
- 已重启 gateway。

---

## 后续部署步骤

1. 在服务器创建真实 `.env.production`，包含 `PORTAL_USERNAME`、`PORTAL_PASSWORD`、`PORTAL_SESSION_SECRET`。
2. 执行：

```bash
cd /root/apps/portal
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

3. 确认容器运行：

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

4. 备份 gateway 配置：

```bash
cp /root/apps/brianhub-gateway/Caddyfile /root/apps/brianhub-gateway/Caddyfile.backup-portal-20260724
```

5. 把 gateway 中的：

```caddyfile
redir / /usstock
```

替换为：

```caddyfile
handle / {
    reverse_proxy portal_frontend:3000
}
```

6. 重启 gateway：

```bash
cd /root/apps/brianhub-gateway
docker compose up -d
```

---

## 验收命令

```bash
curl -I https://brianhub.net/
curl -I https://brianhub.net/usstock
curl -I https://brianhub.net/cnstock
curl -I https://brianhub.net/gps
curl -I https://brianhub.net/maildesk
curl -I https://brianhub.net/translator
```

预期：

- `/` 返回门户页面，不再跳转 `/usstock`。
- 五个项目路径仍保持可访问。
- 门户登录、导航、退出流程正常。

## 本地验证记录

本地使用 Codex 自带 Node 运行测试。由于当前 Windows 沙箱里 `node --test` 的文件派生会触发 `spawn EPERM`，测试脚本改为直接执行两个测试文件。

验证命令：

```powershell
$env:PATH='C:\Users\12514\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
pnpm test
```

测试结果：认证测试 3 个通过，服务器路由测试 7 个通过。

## 线上部署记录

部署日期：2026-07-24

已上线内容：

- `https://brianhub.net/` 现在由门户应用提供，不再跳转到 `/usstock`。
- 门户部署目录为 `/root/apps/portal`。
- 门户容器为 `brianhub-portal-portal-1`。
- 门户账号用户名统一为小写 `brian`。
- 门户密码沿用用户指定的统一密码，不在文档中展开记录。
- `/usstock`、`/cnstock`、`/gps`、`/maildesk`、`/translator` 路由保持可访问。

线上核验记录：

- 门户容器状态：`brianhub-portal-portal-1` 正常运行。
- 门户登录接口：小写 `brian` 返回登录成功跳转。
- 门户登录接口：大写 `Brian` 返回 401。

## 下一批工作

第一期门户上线后，再单独拆分项目 SSO 接入计划。建议顺序：

```text
usstock -> cnstock -> maildesk -> gps -> translator
```
