const projects = [
  { id: 'usstock', name: '美股', path: '/usstock', description: '美股行情、组合和交易观察台。', healthUrl: 'http://usstock_backend:8000/health' },
  { id: 'cnstock', name: 'A 股', path: '/cnstock', description: 'A 股行情跟踪和市场分析工作台。', healthUrl: 'http://cnstock_backend:8000/health' },
  { id: 'yanqing', name: '研擎', path: '/yanqing', description: '独立 AI 个股深研工作台，手动输入材料生成基本盘、矛盾、证据链和跟踪触发器。', healthUrl: 'http://yanqing_app:8000/api/health' },
  { id: 'maildesk', name: '邮件工作台', path: '/maildesk', description: '日常邮件流程、客户事务和案例处理。', healthUrl: 'http://maildesk_backend:8000/health' },
  { id: 'gps', name: 'GPS 工具', path: '/gps', description: '定位、轨迹和 GPS 相关工作流。', healthUrl: 'http://172.19.0.1:8015/health' },
  { id: 'factsheet', name: 'factsheet', path: '/factsheet', description: 'Factsheet project entry.', healthUrl: 'http://factsheet_app:3000/health' },
  { id: 'rail-cost', name: '境外段铁路成本', path: '/rail-cost', description: '境外段铁路成本和 TC 箱租箱价格查询模块。' },
  { id: 'learndesk', name: '聚合学习工作台', path: '/learndesk', description: 'AI 老师式聚合学习、主题研究、课程讲义和学习项目留档。', healthUrl: 'http://learndesk_app:3000/health' },
  { id: 'nas', name: 'NAS 管理', path: '/nas', description: 'NAS 存储容量、系统负载、Docker 容器和空间扫描驾驶舱。', healthUrl: 'http://172.19.0.1:13001/health' },
  { id: 'homeassistant', name: '智能家居控制台', path: '/homeassistant', description: '统一查看和控制家庭 Home Assistant 智能家居设备。', healthUrl: 'http://homeassistant_app:3000/health' },
  { id: 'translator', name: '翻译助手', path: '/translator', description: '中英文翻译、润色和词汇积累。', healthUrl: 'http://translator_app:3000/api/history' }
];

module.exports = { projects };
