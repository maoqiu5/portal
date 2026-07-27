# BrianHub 门户与分阶段 SSO 设计

日期：2026-07-24

## 目标

BrianHub 使用 `https://brianhub.net/` 作为统一导航门户，集中放置当前 5 个项目入口：

- `cnstock`
- `gps`
- `maildesk`
- `usstock`
- `translator`

长期目标是真正的单点登录：用户只在门户登录一次，就可以进入所有项目，不再看到各项目自己的独立登录。

实施采用分阶段方式。第一期先上线门户、统一登录入口和导航；后续再把现有项目逐个迁移为信任门户会话。

## 当前服务器背景

VPS 连接方式：

```bash
ssh -i ~/.ssh/cnstock_vps root@192.236.235.229
```

当前 `/root/apps` 下主要项目：

```text
brianhub-gateway
cnstock
gps
maildesk
translator
us-stock-cockpit
```

`brianhub-gateway` 负责公网入口、TLS 和路径路由。它应继续保持网关职责，不承载门户应用代码。

当前网关把根路径跳转到美股项目：

```caddyfile
redir / /usstock
```

门户部署后，这个根路径跳转会被替换为门户反向代理。

## 目标访问结构

```text
https://brianhub.net/             -> 门户首页和登录页
https://brianhub.net/usstock      -> 美股项目
https://brianhub.net/cnstock      -> A 股项目
https://brianhub.net/gps          -> GPS 项目
https://brianhub.net/maildesk     -> Maildesk 项目
https://brianhub.net/translator   -> 翻译项目
```

现有项目路径保持不变，根路径成为门户。

## 项目边界

门户作为独立项目部署在服务器：

```text
/root/apps/portal
```

使用独立 Docker Compose 项目名：

```yaml
name: brianhub-portal
```

门户容器加入现有外部网络：

```yaml
networks:
  brianhub_edge:
    name: brianhub_edge
    external: true
```

第一期使用一个 Node/Express 服务，网络别名为：

```text
portal_frontend
```

门户不读写其他项目的数据目录。门户自己的数据目录为：

```text
/root/apps/portal/data/portal/
```

## 第一期范围

第一期目标是先交付一个可用门户，不要求 5 个项目一次性完成 SSO 改造。

第一期功能：

- `https://brianhub.net/` 显示门户。
- 未登录时显示登录页。
- 登录表单包含用户名和密码。
- 登录后显示项目导航页。
- 导航页包含 `cnstock`、`gps`、`maildesk`、`usstock`、`translator` 五个入口。
- 支持退出登录并清除门户会话。
- 支持 `returnTo`，用户登录后可以回到原本想访问的项目。
- 网关增加门户路由，同时保留所有现有项目路由。

第一期内，现有项目可能仍显示自己的旧登录页。这只作为迁移期间的临时状态。

## 长期 SSO 设计

门户登录成功后签发 `brianhub.net` 域名下的统一会话 Cookie。

生产环境 Cookie 属性：

```text
HttpOnly
Secure
SameSite=Lax
Path=/
```

Cookie 不允许被前端 JavaScript 读取。项目迁移到 SSO 后，不应继续把应用密码保存在 `localStorage`。

迁移后的项目行为：

```text
存在有效门户会话 -> 允许访问页面和 API
没有有效门户会话 -> 页面访问跳回 /
没有有效门户会话 -> API 返回 401/403，或由网关统一处理
```

后续项目迁移时再确定最终校验机制，候选方案包括：

- 在网关层做认证检查，再反代到项目。
- 项目后端调用门户后端的统一认证检查接口。
- 项目后端共享签名会话密钥，自行校验门户 Cookie。

推荐方向是网关层认证或门户统一认证接口，避免每个项目重复实现登录逻辑。

## 建议迁移顺序

后续按项目逐个迁移到 SSO：

```text
usstock -> cnstock -> maildesk -> gps -> translator
```

原因：

- `usstock` 原本是根路径默认项目，适合作为第一个 SSO 样板。
- `cnstock` 结构看起来和 `usstock` 接近，迁移经验可复用。
- `maildesk` 有 VNC 特殊路由，放在更简单项目之后处理。
- `gps` 是静态文件加 API 路由，接入方式可能不同。
- `translator` 看起来是单容器应用，可在通用模型稳定后迁移。

## 网关改动

网关需要保留现有项目路由，只替换根路径行为。

当前行为：

```caddyfile
redir / /usstock
```

门户上线后的目标行为：

```caddyfile
handle / {
    reverse_proxy portal_frontend:3000
}
```

如果门户后续改为前端框架，可能需要额外处理静态资源路径。第一期 Node/Express 应用使用 `/assets/styles.css`，由门户服务自己处理即可。

现有 `/usstock`、`/cnstock`、`/gps`、`/maildesk`、`/translator` 路由必须保持不变。Maildesk 的 VNC 特殊路由必须继续放在 Maildesk catch-all 前面。

## 验收标准

第一期验收命令：

```bash
curl -I https://brianhub.net/
curl -I https://brianhub.net/usstock
curl -I https://brianhub.net/cnstock
curl -I https://brianhub.net/gps
curl -I https://brianhub.net/maildesk
curl -I https://brianhub.net/translator
```

第一期预期结果：

- `/` 返回门户页面，不再跳转 `/usstock`。
- 5 个现有项目路径仍可访问。
- 现有 API 路径不被破坏。
- Maildesk VNC 特殊入口保持原有保护和访问方式。
- 退出登录后门户会话失效。

最终 SSO 完成后的验收：

- 在 `https://brianhub.net/` 登录一次。
- 打开 5 个项目都不再出现项目自己的登录页。
- 登录状态下可以调用已迁移项目的受保护 API。
- 在门户退出登录。
- 所有已迁移项目都拒绝或重定向未登录访问。

## 风险和约束

- 不把业务项目代码放进 `/root/apps/brianhub-gateway`。
- 不让门户读写其他项目数据目录。
- 添加门户路由时不删除现有项目路由。
- 不提交或打印生产密码、API key、`.env.production`、应用密码文件和项目数据。
- Maildesk VNC 特殊路由必须保持在 catch-all 路由前。
- Caddy 路由顺序敏感，门户路由不能吞掉现有项目路径。

## 后续实施决策

第一期已经选择 Node/Express 单服务门户。后续 SSO 项目迁移时仍需逐个确认：

- 每个项目当前登录逻辑所在文件。
- 页面访问和 API 访问分别如何校验门户会话。
- 是否采用网关层统一认证检查。
- 旧的 `localStorage` 密码逻辑如何清理。
