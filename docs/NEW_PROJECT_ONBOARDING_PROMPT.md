# BrianHub 新项目接入提示词

## 用途

把本文件内容发给任何新的 Codex 项目或新的 AI 开发会话，让它在动代码前先读取 BrianHub 的统一规范。

推荐做法：
- 如果新项目能连接 VPS，优先读取 VPS 上的门户文档。
- 如果暂时不能连接 VPS，先通过门户网页查看文档，再让用户补充 VPS 权限。

## 可直接复制给新项目的提示词

```text
这是一个 BrianHub 新项目。开始开发前，必须先读取 BrianHub 门户项目里的统一规范文档，并按规范设计、开发、部署和归档文档。

VPS 连接方式：
ssh -i "$HOME\.ssh\cnstock_vps" root@192.236.235.229

必须先读取：
/root/apps/portal/docs/README.md
/root/apps/portal/docs/BRIANHUB_DEVELOPMENT_STANDARD.md
/root/apps/portal/docs/NEW_PROJECT_DOCUMENTATION_REQUIREMENTS.md

如果需要查看门户网页文档，可访问：
https://brianhub.net/?tab=docs&project=portal&doc=docs%2FBRIANHUB_DEVELOPMENT_STANDARD.md
https://brianhub.net/?tab=docs&project=portal&doc=docs%2FNEW_PROJECT_DOCUMENTATION_REQUIREMENTS.md

开发硬性要求：
1. 默认按 BrianHub 通用开发规则执行。
2. 新项目必须创建 docs/README.md、docs/PRD.md、docs/DEPLOYMENT.md、docs/CHANGELOG.md。
3. 默认接入 BrianHub 门户统一登录，不新建项目内独立登录和用户管理。
4. 如使用 AI API，配置从门户 AI 接口统一读取，不在项目内另建 API Key 配置页。
5. 数据库、上传文件、备份、日志、运行产物必须有明确目录边界。
6. Docker 服务加入 brianhub_edge 网络，公网入口由 brianhub-gateway 统一代理。
7. 普通业务项目不要启动 Caddy/Nginx 监听 80/443。
8. 上线前必须写清部署、验证、回滚和健康检查方式。
9. 不得在代码、文档、日志、页面或接口返回中泄露真实密码、API Key、Cookie、内部令牌或私钥。
10. 上线后必须能在 BrianHub 门户文档中心看到项目文档。

执行方式：
1. 先读取上述规范文档。
2. 再检查当前项目结构。
3. 先形成简短设计和实施计划。
4. 再按测试、实现、验证、部署、文档更新的顺序推进。
5. 如果发现现有项目规则和 BrianHub 标准冲突，先列出冲突点和建议，不要盲目覆盖线上配置。
```

## 给用户的最短版本

如果只想发一句话给新项目，可以发：

```text
这是 BrianHub 新项目。请先连接 VPS 读取 /root/apps/portal/docs/BRIANHUB_DEVELOPMENT_STANDARD.md 和 /root/apps/portal/docs/NEW_PROJECT_DOCUMENTATION_REQUIREMENTS.md，再按规范开发、部署和补齐 docs/README.md、docs/PRD.md、docs/DEPLOYMENT.md、docs/CHANGELOG.md。
```

## 新项目第一次检查清单

- [ ] 已连接 VPS 或已通过门户网页打开规范文档。
- [ ] 已读取 `BRIANHUB_DEVELOPMENT_STANDARD.md`。
- [ ] 已读取 `NEW_PROJECT_DOCUMENTATION_REQUIREMENTS.md`。
- [ ] 已确认项目 slug。
- [ ] 已确认线上路径。
- [ ] 已确认是否接入门户 SSO。
- [ ] 已确认是否使用门户 AI 配置。
- [ ] 已确认数据目录、备份目录和日志目录。
- [ ] 已创建标准四件套文档。
- [ ] 已确认没有把真实密钥写入文档。

## 相关文档

- BrianHub 通用开发规则：`/root/apps/portal/docs/BRIANHUB_DEVELOPMENT_STANDARD.md`
- BrianHub 新项目文档要求：`/root/apps/portal/docs/NEW_PROJECT_DOCUMENTATION_REQUIREMENTS.md`
- 门户文档入口：`/root/apps/portal/docs/README.md`
