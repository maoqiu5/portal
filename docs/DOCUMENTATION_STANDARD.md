# BrianHub 文档归档和编写规则

## 目标

BrianHub 所有线上项目的正式文档以 VPS `/root/apps` 下的项目目录为准。每个项目必须有清晰的文档入口，门户提供统一只读浏览和索引，不复制各项目正文。

## 统一目录

每个项目优先使用以下结构：

```text
docs/
  README.md              # 文档入口，必须有
  PRD.md                 # 当前产品状态和边界
  DEPLOYMENT.md          # 部署、VPS、网关、容器说明
  CHANGELOG.md           # 正式版本变更记录
  HANDOFF.md             # 接手上下文，可选
  runbooks/              # 运维手册
  reports/               # 验证报告、阶段报告
  specs/                 # 设计文档
  plans/                 # 实施计划
  archive/               # 历史文档和旧入口
```

## 编写规则

- 正式文档使用中文为主，命令、路径、接口名保留原文。
- 每份文档开头必须说明用途，避免只有过程记录没有结论。
- PRD 记录当前产品状态、功能边界、数据原则和路线图。
- DEPLOYMENT 记录线上路径、服务目录、容器、网关、发布和回滚方式。
- CHANGELOG 只记录正式变更，不写长篇排查过程。
- 过程记录、一次性排查、临时方案放入 `docs/reports/` 或 `docs/archive/`。
- 旧文档如保留，只在 `docs/README.md` 中标记状态，不继续追加新内容。

## 排除规则

门户文档中心不索引以下目录或文件：

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
- 以 `._` 开头的 macOS 影子文件

邮件日报、业务报告原始产物、备份中的 Markdown 不进入正式项目文档中心；需要查询时应单独建立“邮件简报归档”模块。

## 跨项目规则

跨项目规则由门户作为主版本维护：

- 文档标准：`/root/apps/portal/docs/DOCUMENTATION_STANDARD.md`
- 项目总览：`/root/apps/portal/docs/BRIANHUB_PROJECTS.md`
- 网关、SSO、AI 配置统一规则：`/root/apps/portal/docs/BRIANHUB_GATEWAY_AND_SSO.md`

业务项目可以链接这些门户文档，但不要复制全文，避免规则分叉。

## 更新检查清单

- 修改功能边界时，更新 PRD。
- 修改部署、路径、网关、容器、环境变量时，更新 DEPLOYMENT。
- 修改正式功能、数据结构、接口或运维规则时，更新 CHANGELOG。
- 新增专题文档后，在 `docs/README.md` 增加入口。
- 不写真实密码、内部令牌或 AI API Key。
