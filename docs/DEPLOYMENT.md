# BrianHub 门户部署说明

更新时间：2026-07-25  
项目代号：`portal`  
生产目录：`/root/apps/portal`

## 1. 线上入口

- 门户首页：`https://brianhub.net/`
- 登录页：`https://brianhub.net/login`
- 用户管理：`https://brianhub.net/users`
- AI 接口配置：`https://brianhub.net/ai-config`
- 文档中心：`https://brianhub.net/?tab=docs`
- 文档审计：`https://brianhub.net/docs/audit`

## 2. 运行方式

- 技术栈：Node.js、Express、原生服务端渲染。
- 启动命令：`node src/server.js`
- Compose 项目名：`brianhub-portal`
- 服务名：`portal`
- 网络别名：`portal_frontend`
- 共享网络：`brianhub_edge`
- 生产数据目录：`/root/apps/portal/data`

门户容器只在共享 Docker 网络内提供服务，公网入口由 `brianhub-gateway` 转发。

## 3. 生产配置

生产环境文件位于：

```text
/root/apps/portal/.env.production
```

文档只记录变量用途，不记录真实值。

- 门户管理员初始用户和密码。
- 会话签名密钥。
- 内部服务访问令牌。
- 配置文件路径。
- Cookie、会话有效期和运行端口。

AI API Key 只保存在门户配置存储中，页面脱敏展示，内部接口只给受信任服务读取。

## 4. 部署命令

进入生产目录：

```bash
cd /root/apps/portal
```

运行测试：

```bash
npm test
```

重建并启动：

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build portal
```

查看状态：

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

查看日志：

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=120 portal
```

## 5. 发布验证

至少验证：

- `/login` 可打开。
- 使用有效账号登录后回到首页。
- `/users` 可打开。
- `/ai-config` 可打开且密钥脱敏。
- `/docs/audit` 返回 JSON。
- `/?tab=docs` 可浏览项目文档。
- gateway `forward_auth` 访问 `/auth/check` 能正确判断登录状态。

验证时不要在命令、日志或文档中输出真实密码、内部令牌或 AI API Key。

## 6. 回滚

如果门户发布后异常：

1. 保留 portal 容器日志。
2. 恢复上一版代码或上一份已验证构建。
3. 不删除 `/root/apps/portal/data`。
4. 重新执行 Compose 构建启动。
5. 复测登录、文档中心、AI 配置和 gateway 认证检查。

## 7. 数据保护

不得覆盖或删除：

- `/root/apps/portal/.env.production`
- `/root/apps/portal/data`
- 门户配置文件
- 用户配置
- AI 接口配置

发布代码时排除依赖、缓存、日志和生产数据目录。
