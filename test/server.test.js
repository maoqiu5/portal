const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');
const { createApp } = require('../src/server');

function makeDocsProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-docs-'));
  fs.mkdirSync(path.join(root, 'docs', 'reports'), { recursive: true });
  fs.mkdirSync(path.join(root, 'node_modules', 'pkg'), { recursive: true });
  fs.mkdirSync(path.join(root, 'report-source'), { recursive: true });
  fs.mkdirSync(path.join(root, 'secrets'), { recursive: true });
  fs.mkdirSync(path.join(root, '.engramory-memory'), { recursive: true });
  fs.writeFileSync(path.join(root, 'README.md'), '# 项目入口\n\n入口内容\n');
  fs.writeFileSync(path.join(root, 'docs', 'PRD.md'), '# 产品说明\n\n## 范围\n\nPRD 内容\n');
  fs.writeFileSync(path.join(root, 'docs', 'reports', 'RUN.md'), '# 运行报告\n\n报告内容\n');
  fs.writeFileSync(path.join(root, '.engramory-memory', 'MEMORY.md'), '# 长期记忆\n\n项目长期上下文\n');
  fs.writeFileSync(path.join(root, 'node_modules', 'pkg', 'README.md'), '# 噪声文档\n');
  fs.writeFileSync(path.join(root, 'report-source', 'daily.md'), '# 日报产物\n');
  fs.writeFileSync(path.join(root, 'secrets', 'README.md'), '# 私有说明\n');
  return { id: 'demo', name: '演示项目', root };
}

function app(options = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-server-'));
  return createApp({
    portalUsername: 'brian',
    portalPassword: 'secret',
    sessionSecret: 'session-secret',
    secureCookie: false,
    configPath: path.join(dir, 'portal-config.json'),
    documentProjects: [makeDocsProject()],
    ...options
  });
}

async function loginAgent(instance = app()) {
  const agent = request.agent(instance);
  await agent.post('/login').type('form').send({ username: 'brian', password: 'secret', returnTo: '/' });
  return agent;
}

test('GET / shows English login page with a background image layer by default', async () => {
  const res = await request(app()).get('/');
  assert.equal(res.status, 200);
  assert.match(res.text, /Sign in to BrianHub/);
  assert.match(res.text, /action="\/locale"/);
  assert.match(res.text, /value="zh-CN"/);
  assert.doesNotMatch(res.text, /统一进入美股、A 股、邮件、GPS 和翻译工具/);
  assert.match(res.text, /login-background/);
  assert.doesNotMatch(res.text, /Portal sign in/);
});

test('GET / renders Chinese login page when locale cookie is zh-CN', async () => {
  const res = await request(app()).get('/').set('Cookie', 'brianhub_locale=zh-CN');
  assert.equal(res.status, 200);
  assert.match(res.text, /登录 BrianHub/);
  assert.match(res.text, /用户名/);
  assert.match(res.text, /English/);
});

test('GET /assets/styles.css keeps login background visible above page background', async () => {
  const res = await request(app()).get('/assets/styles.css');
  assert.equal(res.status, 200);
  assert.match(res.text, /--accent:\s*#0b6bcb;/);
  assert.match(res.text, /--accent-dark:\s*#074f96;/);
  assert.match(res.text, /linear-gradient\(120deg/);
  assert.match(res.text, /repeating-linear-gradient\(110deg/);
  assert.doesNotMatch(res.text, /images\.unsplash\.com/);
  assert.match(res.text, /\.login-background\s*\{[\s\S]*z-index:\s*0;/);
  assert.match(res.text, /\.login-panel\s*\{[\s\S]*z-index:\s*1;/);
  assert.match(res.text, /\.login-panel\s*\{[\s\S]*border-top:\s*4px solid var\(--accent\);/);
});

test('POST /login renders localized wrong credential message', async () => {
  const wrongUser = await request(app()).post('/login').set('Cookie', 'brianhub_locale=zh-CN').type('form').send({ username: 'wrong', password: 'secret', returnTo: '/' });
  assert.equal(wrongUser.status, 401);
  assert.match(wrongUser.text, /用户名或密码错误/);

  const wrongPassword = await request(app()).post('/login').set('Cookie', 'brianhub_locale=zh-CN').type('form').send({ username: 'brian', password: 'wrong', returnTo: '/' });
  assert.equal(wrongPassword.status, 401);
  assert.match(wrongPassword.text, /用户名或密码错误/);
});

test('POST /login sets session cookie and redirects only to safe returnTo', async () => {
  const good = await request(app()).post('/login').type('form').send({ username: 'brian', password: 'secret', returnTo: '/usstock' });
  assert.equal(good.status, 302);
  assert.equal(good.headers.location, '/usstock');
  assert.match(good.headers['set-cookie'].join('\n'), /brianhub_session=/);
  assert.match(good.headers['set-cookie'].join('\n'), /brianhub_locale=en-US/);

  const external = await request(app()).post('/login').type('form').send({ username: 'brian', password: 'secret', returnTo: 'https://example.com' });
  assert.equal(external.status, 302);
  assert.equal(external.headers.location, '/');
});

test('POST /locale stores selected language in cookie and signed-in user config', async () => {
  const instance = app();
  const anonymous = await request(instance).post('/locale').type('form').send({ locale: 'zh-CN', returnTo: '/' });
  assert.equal(anonymous.status, 302);
  assert.equal(anonymous.headers.location, '/');
  assert.match(anonymous.headers['set-cookie'].join('\n'), /brianhub_locale=zh-CN/);

  const agent = await loginAgent(instance);
  const saved = await agent.post('/locale').type('form').send({ locale: 'zh-CN', returnTo: '/?tab=users' });
  assert.equal(saved.status, 302);
  assert.equal(saved.headers.location, '/?tab=users');
  assert.match(saved.headers['set-cookie'].join('\n'), /brianhub_locale=zh-CN/);

  const auth = await agent.get('/auth/check');
  assert.equal(auth.headers['x-brianhub-locale'], 'zh-CN');
});

test('POST /locale falls back unknown language to English', async () => {
  const res = await request(app()).post('/locale').type('form').send({ locale: 'fr-FR', returnTo: '/' });
  assert.equal(res.status, 302);
  assert.match(res.headers['set-cookie'].join('\n'), /brianhub_locale=en-US/);
});

test('GET / shows English portal with valid session and language switcher', async () => {
  const agent = await loginAgent();
  const res = await agent.get('/');
  assert.equal(res.status, 200);
  assert.match(res.text, /Projects/);
  assert.match(res.text, /US Stocks/);
  assert.match(res.text, /Translator/);
  assert.match(res.text, /Documents/);
  assert.match(res.text, /Sign out/);
  assert.match(res.text, /action="\/locale"/);
});

test('GET / shows Chinese portal when signed-in user locale is zh-CN', async () => {
  const instance = app();
  const agent = await loginAgent(instance);
  await agent.post('/locale').type('form').send({ locale: 'zh-CN', returnTo: '/' });
  const res = await agent.get('/');
  assert.equal(res.status, 200);
  assert.match(res.text, /项目导航/);
  assert.match(res.text, /美股/);
  assert.match(res.text, /翻译助手/);
  assert.match(res.text, /文档中心/);
  assert.match(res.text, /退出登录/);
});

test('POST /users/create creates a user and redirects with success popup message', async () => {
  const instance = app();
  const agent = await loginAgent(instance);
  const createRes = await agent.post('/users/create').type('form').send({ username: 'alice', password: 'pass1234', role: 'user', allowedProjects: ['rail-cost'] });
  assert.equal(createRes.status, 302);
  assert.equal(createRes.headers.location, '/?tab=users&message=User+created');

  const loginRes = await request(instance).post('/login').type('form').send({ username: 'alice', password: 'pass1234', returnTo: '/' });
  assert.equal(loginRes.status, 302);
});

test('regular user sees only authorized project modules and no management tabs', async () => {
  const instance = app();
  const admin = await loginAgent(instance);
  await admin.post('/users/create').type('form').send({ username: 'cindy', password: 'pass1234', role: 'user', allowedProjects: ['rail-cost'] });

  const cindy = request.agent(instance);
  await cindy.post('/login').type('form').send({ username: 'cindy', password: 'pass1234', returnTo: '/' });
  const home = await cindy.get('/');

  assert.equal(home.status, 200);
  assert.match(home.text, /cindy · Standard user/);
  assert.match(home.text, /Overseas Rail Cost/);
  assert.match(home.text, /href="\/rail-cost"/);
  assert.doesNotMatch(home.text, /US Stocks/);
  assert.doesNotMatch(home.text, /Maildesk/);
  assert.doesNotMatch(home.text, />Users</);
  assert.doesNotMatch(home.text, />Documents</);

  assert.equal((await cindy.get('/docs/index')).status, 403);
  assert.equal((await cindy.get('/?tab=users')).status, 200);
  assert.doesNotMatch((await cindy.get('/?tab=users')).text, />Users</);
});

test('admin can update user project permissions from user management', async () => {
  const instance = app();
  const admin = await loginAgent(instance);
  await admin.post('/users/create').type('form').send({ username: 'cindy', password: 'pass1234', role: 'user', allowedProjects: ['rail-cost'] });

  const updateRes = await admin.post('/users/cindy/projects').type('form').send({ allowedProjects: ['rail-cost', 'nas'] });
  assert.equal(updateRes.status, 302);
  assert.equal(updateRes.headers.location, '/?tab=users&message=Module+permissions+updated');

  const cindy = request.agent(instance);
  await cindy.post('/login').type('form').send({ username: 'cindy', password: 'pass1234', returnTo: '/' });
  const home = await cindy.get('/');
  assert.match(home.text, /Overseas Rail Cost/);
  assert.doesNotMatch(home.text, /NAS Management/);
  assert.doesNotMatch(home.text, /US Stocks/);
});

test('POST /users/:username/status disables a user and password reset changes login password', async () => {
  const instance = app();
  const agent = await loginAgent(instance);
  await agent.post('/users/create').type('form').send({ username: 'alice', password: 'pass1234', role: 'user' });

  const disableRes = await agent.post('/users/alice/status').type('form').send({ status: 'disabled' });
  assert.equal(disableRes.status, 302);
  assert.equal(disableRes.headers.location, '/?tab=users&message=User+status+updated');

  const disabledLogin = await request(instance).post('/login').type('form').send({ username: 'alice', password: 'pass1234', returnTo: '/' });
  assert.equal(disabledLogin.status, 401);

  await agent.post('/users/alice/status').type('form').send({ status: 'active' });
  const resetRes = await agent.post('/users/alice/password').type('form').send({ password: 'newpass123' });
  assert.equal(resetRes.headers.location, '/?tab=users&message=Password+reset');
  const loginRes = await request(instance).post('/login').type('form').send({ username: 'alice', password: 'newpass123', returnTo: '/' });
  assert.equal(loginRes.status, 302);
});

test('POST /ai-config saves ai config and internal endpoint returns secret only with internal token', async () => {
  const instance = app();
  const agent = await loginAgent(instance);
  const saveRes = await agent.post('/ai-config').type('form').send({
    enabled: '1',
    baseUrl: 'https://api.example.com/v1',
    apiKey: 'sk-secret',
    model: 'gpt-test',
    timeoutSeconds: '180',
    analysisLimit: '25'
  });
  assert.equal(saveRes.status, 302);
  assert.equal(saveRes.headers.location, '/?tab=ai&message=AI+settings+saved');

  const publicRes = await agent.get('/?tab=ai');
  assert.match(publicRes.text, /sk-s\.\.\.cret/);
  assert.doesNotMatch(publicRes.text, /sk-secret/);
  assert.equal((await request(instance).get('/internal/ai-config')).status, 401);
  const allowedRes = await request(instance).get('/internal/ai-config').set('X-Internal-Token', 'session-secret');
  assert.equal(allowedRes.body.apiKey, 'sk-secret');
});

test('POST /notification-config saves wecom config and internal endpoint returns secret only with internal token', async () => {
  const instance = app();
  const agent = await loginAgent(instance);
  const saveRes = await agent.post('/notification-config').type('form').send({
    enabled: '1',
    appName: 'Ops Alerts',
    corpId: 'ww-corp',
    agentId: '1000002',
    secret: 'wecom-secret',
    touser: 'brian|cindy',
    toparty: '2',
    totag: 'ops',
    webhook: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=abc',
    markdownTemplate: '## {{title}}\n{{content}}'
  });
  assert.equal(saveRes.status, 302);
  assert.equal(saveRes.headers.location, '/?tab=notifications&message=Notification+settings+saved');

  const publicRes = await agent.get('/?tab=notifications');
  assert.match(publicRes.text, /Notification interface/);
  assert.match(publicRes.text, /weco\.\.\.cret/);
  assert.match(publicRes.text, /Ops Alerts/);
  assert.doesNotMatch(publicRes.text, /wecom-secret/);

  assert.equal((await request(instance).get('/internal/notification-config')).status, 401);
  const allowedRes = await request(instance).get('/internal/notification-config').set('X-Internal-Token', 'session-secret');
  assert.equal(allowedRes.status, 200);
  assert.equal(allowedRes.body.secret, 'wecom-secret');
  assert.equal(allowedRes.body.corpId, 'ww-corp');
  assert.equal(allowedRes.body.agentId, '1000002');
  assert.equal(allowedRes.body.touser, 'brian|cindy');
  assert.equal(allowedRes.body.markdownTemplate, '## {{title}}\n{{content}}');
});

test('notification interface is admin-only and hidden from regular users', async () => {
  const instance = app();
  const admin = await loginAgent(instance);
  await admin.post('/users/create').type('form').send({ username: 'cindy', password: 'pass1234', role: 'user', allowedProjects: ['rail-cost'] });

  const cindy = request.agent(instance);
  await cindy.post('/login').type('form').send({ username: 'cindy', password: 'pass1234', returnTo: '/' });

  const home = await cindy.get('/');
  assert.doesNotMatch(home.text, />Notifications</);
  assert.equal((await cindy.get('/?tab=notifications')).status, 200);
  assert.doesNotMatch((await cindy.get('/?tab=notifications')).text, /Notification interface/);

  const postRes = await cindy.post('/notification-config').type('form').send({ enabled: '1', appName: 'Bad' });
  assert.equal(postRes.status, 302);
  assert.match(postRes.headers.location, /^\/\?tab=notifications&error=/);
});

test('POST /ai-config/test validates saved ai config without exposing the secret', async () => {
  const fetchCalls = [];
  const instance = app({
    fetchImpl: async (url, options) => {
      fetchCalls.push({ url, options });
      return { ok: true, status: 200 };
    }
  });
  const agent = await loginAgent(instance);
  await agent.post('/ai-config').type('form').send({ enabled: '1', baseUrl: 'https://api.example.com/v1', apiKey: 'sk-secret', model: 'gpt-test', timeoutSeconds: '180', analysisLimit: '25' });
  const testRes = await agent.post('/ai-config/test').type('form').send({ enabled: '1', baseUrl: 'https://api.example.com/v1', apiKey: '', model: 'gpt-test', timeoutSeconds: '180', analysisLimit: '25' });
  assert.equal(testRes.status, 302);
  assert.match(testRes.headers.location, /^\/\?tab=ai&message=/);
  assert.equal(fetchCalls.at(-1).url, 'https://api.example.com/v1/chat/completions');
  assert.match(fetchCalls.at(-1).options.headers.Authorization, /^Bearer sk-secret$/);
  assert.doesNotMatch(testRes.headers.location, /sk-secret/);
});

test('POST /ai-config/test reports failed ai connection', async () => {
  const instance = app({ fetchImpl: async () => ({ ok: false, status: 401 }) });
  const agent = await loginAgent(instance);
  const testRes = await agent.post('/ai-config/test').type('form').send({ enabled: '1', baseUrl: 'https://api.example.com/v1', apiKey: 'sk-secret', model: 'gpt-test', timeoutSeconds: '180', analysisLimit: '25' });
  assert.equal(testRes.status, 302);
  assert.match(testRes.headers.location, /^\/\?tab=ai&error=/);
});

test('GET /health/projects returns project health from configured health urls', async () => {
  const instance = app({
    projects: [
      { id: 'ok', name: 'OK', path: '/ok', description: 'ok', healthUrl: 'http://ok/health' },
      { id: 'bad', name: 'BAD', path: '/bad', description: 'bad', healthUrl: 'http://bad/health' }
    ],
    fetchImpl: async (url) => ({ ok: url === 'http://ok/health', status: url === 'http://ok/health' ? 200 : 500 })
  });
  const agent = await loginAgent(instance);
  const res = await agent.get('/health/projects');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.map((item) => ({ id: item.id, status: item.status })), [
    { id: 'ok', status: 'ok' },
    { id: 'bad', status: 'error' }
  ]);
});

test('GET / renders project health badges on project cards', async () => {
  const instance = app({ projects: [{ id: 'ok', name: 'OK', path: '/ok', description: 'ok', healthUrl: 'http://ok/health' }], fetchImpl: async () => ({ ok: true, status: 200 }) });
  const agent = await loginAgent(instance);
  const res = await agent.get('/');
  assert.match(res.text, /health-badge health-ok/);
});

test('GET /docs/index returns formal docs and excludes dependency docs', async () => {
  const agent = await loginAgent();
  const res = await agent.get('/docs/index');
  assert.equal(res.status, 200);
  assert.equal(res.body.projects[0].name, '演示项目');
  assert.deepEqual(res.body.projects[0].documents.map((doc) => doc.path), ['README.md', 'docs/PRD.md', 'docs/reports/RUN.md', '.engramory-memory/MEMORY.md']);
  assert.equal(res.body.projects[0].documents.at(-1).category, '长期记忆');
  assert.doesNotMatch(JSON.stringify(res.body), /node_modules/);
  assert.doesNotMatch(JSON.stringify(res.body), /report-source/);
  assert.doesNotMatch(JSON.stringify(res.body), /secrets/);
});

test('GET /docs/audit returns documentation quality status', async () => {
  const agent = await loginAgent();
  const res = await agent.get('/docs/audit');
  assert.equal(res.status, 200);
  assert.equal(res.body.projects[0].id, 'demo');
  assert.equal(res.body.projects[0].status, 'missing');
  assert.deepEqual(res.body.projects[0].missingRequired, ['docs/README.md', 'docs/DEPLOYMENT.md', 'docs/CHANGELOG.md']);
});

test('GET /docs/view reads one configured markdown file and blocks traversal', async () => {
  const agent = await loginAgent();
  const good = await agent.get('/docs/view').query({ project: 'demo', path: 'docs/PRD.md' });
  assert.equal(good.status, 200);
  assert.equal(good.body.document.title, '产品说明');
  assert.match(good.body.content, /PRD 内容/);

  const bad = await agent.get('/docs/view').query({ project: 'demo', path: '../portal-config.json' });
  assert.equal(bad.status, 404);
});

test('GET /?tab=docs renders optimized document center and selected markdown', async () => {
  const agent = await loginAgent();
  const index = await agent.get('/?tab=docs');
  assert.equal(index.status, 200);
  assert.match(index.text, /Documents/);
  assert.match(index.text, /doc-quick-links/);
  assert.match(index.text, /Project overview/);
  assert.match(index.text, /id="doc-search"/);
  assert.match(index.text, /id="doc-category"/);
  assert.match(index.text, /doc-project-toggle/);
  assert.match(index.text, /doc-core-list/);
  assert.match(index.text, /doc-more-docs/);
  assert.match(index.text, /Core documents/);
  assert.match(index.text, /More documents \(2\)/);
  assert.match(index.text, /4 documents/);
  assert.match(index.text, /长期记忆/);
  assert.match(index.text, /\.engramory-memory\/MEMORY\.md/);
  assert.match(index.text, /Missing 3/);
  assert.match(index.text, /演示项目/);
  assert.match(index.text, /产品说明/);

  const selected = await agent.get('/?tab=docs&project=demo&doc=docs%2FPRD.md');
  assert.equal(selected.status, 200);
  assert.match(selected.text, /<article class="markdown-body">/);
  assert.match(selected.text, /<h1>产品说明<\/h1>/);
  assert.match(selected.text, /<h2>范围<\/h2>/);
  assert.match(selected.text, /PRD 内容/);
});

test('GET / renders localized success and failure popup notices', async () => {
  const agent = await loginAgent();
  const successRes = await agent.get('/?message=保存成功');
  assert.match(successRes.text, /notice-dialog/);
  assert.match(successRes.text, /Dismiss/);
  const errorRes = await agent.get('/?error=保存失败');
  assert.match(errorRes.text, /保存失败/);
});

test('auth check and logout routes keep expected behavior', async () => {
  assert.equal((await request(app()).get('/auth/check')).status, 401);
  const redirect = await request(app()).get('/auth/check?redirect=1').set('X-Forwarded-Uri', '/usstock');
  assert.equal(redirect.headers.location, '/?returnTo=%2Fusstock');

  const agent = await loginAgent();
  const check = await agent.get('/auth/check');
  assert.equal(check.status, 204);
  assert.equal(check.headers['x-brianhub-user'], 'brian');
  assert.equal(check.headers['x-brianhub-locale'], 'en-US');
  assert.equal(check.headers['x-brianhub-role'], 'admin');
  const logout = await agent.post('/logout');
  assert.equal(logout.status, 302);
  assert.match(logout.headers['set-cookie'].join('\n'), /brianhub_session=;/);
});

test('GET /logout clears session cookie and ignores returnTo', async () => {
  const res = await request(app()).get('/logout?returnTo=https://example.com');
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/');
});
