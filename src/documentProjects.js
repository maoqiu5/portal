const path = require('node:path');

const docsRoot = process.env.BRIANHUB_DOCS_ROOT || '/host/apps';

const documentProjects = [
  { id: 'portal', name: '门户', root: path.join(docsRoot, 'portal') },
  { id: 'usstock', name: '美股', root: path.join(docsRoot, 'us-stock-cockpit') },
  { id: 'cnstock', name: 'A 股', root: path.join(docsRoot, 'cnstock') },
  { id: 'maildesk', name: '邮件工作台', root: path.join(docsRoot, 'maildesk') },
  { id: 'gps', name: 'GPS 工具', root: path.join(docsRoot, 'gps') },
  { id: 'rates', name: '境外运价', root: path.join(docsRoot, 'rates') },
  { id: 'translator', name: '翻译助手', root: path.join(docsRoot, 'translator') },
  { id: 'learndesk', name: '聚合学习工作台', root: path.join(docsRoot, 'learndesk') },
  { id: 'nas', name: 'NAS 管理', root: path.join(docsRoot, 'nas') },
  { id: 'homeassistant', name: '智能家居控制台', root: path.join(docsRoot, 'homeassistant') },
  { id: 'gateway', name: 'BrianHub 网关', root: path.join(docsRoot, 'brianhub-gateway') }
];

module.exports = { documentProjects };
