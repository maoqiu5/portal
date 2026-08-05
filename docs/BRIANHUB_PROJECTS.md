# BrianHub 项目总览

## 当前线上项目

| 项目 | 门户路径 | VPS 目录 | 文档入口 |
| --- | --- | --- | --- |
| 门户 | `/` | `/root/apps/portal` | `/root/apps/portal/docs/README.md` |
| 美股 | `/usstock` | `/root/apps/us-stock-cockpit` | `/root/apps/us-stock-cockpit/docs/README.md` |
| A 股 | `/cnstock` | `/root/apps/cnstock` | `/root/apps/cnstock/docs/README.md` |
| 研擎 | `/yanqing` | `/root/apps/yanqing` | `/root/apps/yanqing/docs/README.md` |
| 邮件工作台 | `/maildesk` | `/root/apps/maildesk` | `/root/apps/maildesk/docs/README.md` |
| GPS 工具 | `/gps` | `/root/apps/gps` | `/root/apps/gps/docs/README.md` |
| 境外运价 | `/rates` | `/root/apps/rates` | `/root/apps/rates/docs/README.md` |
| 境外段铁路成本 | `/rail-cost` | `/root/apps/rail-cost` | `/root/apps/rail-cost/docs/README.md` |
| 聚合学习工作台 | `/learndesk` | `/root/apps/learndesk` | `/root/apps/learndesk/docs/README.md` |
| 翻译助手 | `/translator` | `/root/apps/translator` | `/root/apps/translator/docs/README.md` |
| NAS 管理 | `/nas` | `/root/apps/nas` | `/root/apps/nas/docs/README.md` |
| BrianHub 网关 | 基础设施 | `/root/apps/brianhub-gateway` | `/root/apps/brianhub-gateway/docs/README.md` |
| 智能家居控制台 | `/homeassistant` | `/root/apps/homeassistant` | `/root/apps/homeassistant/docs/README.md` |

## 统一原则

- 所有项目通过 `https://brianhub.net/` 统一入口访问。
- 登录、用户、模块权限和 AI API 参数由门户统一管理。
- 每个业务项目保留自己的数据目录、数据库和容器命名空间。
- 网关、SSO、AI 统一配置等跨项目规则以门户文档为主版本。
- 项目文档以 VPS 当前文件为准，门户只读展示。

## 维护顺序

1. 先更新业务项目对应文档。
2. 如涉及跨项目规则，再更新门户主规则。
3. 如涉及网关路由，再更新 brianhub-gateway 文档。
4. 最后在门户文档中心检查索引是否能看到新文档。
