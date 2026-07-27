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

test('GET / shows Chinese login page with a background image layer', async () => {
  const res = await request(app()).get('/');
  assert.equal(res.status, 200);
  assert.match(res.text, /登录 BrianHub/);
  assert.match(res.text, /统一进入美股、A 股、邮件、GPS 和翻译工具/);
  assert.match(res.text, /login-background/);
  assert.doesNotMatch(res.text, /Portal sign in/);
  assert.doesNotMatch(res.text, /Username/);
});

test('GET /assets/styles.css keeps login background visible above page background', async () => {
  const res = await request(app()).get('/assets/styles.css');
  assert.equal(res.status, 200);
  assert.match(res.text, /\.login-background\s*\{[\s\S]*z-index:\s*0;/);
  assert.match(res.text, /\.login-panel\s*\{[\s\S]*z-index:\s*1;/);
});

test('POST /login rejects wrong credentials with Chinese message', async () => {
  const wrongUser = await request(app()).post('/login').type('form').send({ username: 'wrong', password: 'secret', returnTo: '/' });
  assert.equal(wrongUser.status, 401);
  assert.match(wrongUser.text, /用户名或密码错误/);

  const wrongPassword = await request(app()).post('/login').type('form').send({ username: 'brian', password: 'wrong', returnTo: '/' });
  assert.equal(wrongPassword.status, 401);
  assert.match(wrongPassword.text, /用户名或密码错误/);
});

test('POST /login sets session cookie and redirects only to safe returnTo', async () => {
  const good = await request(app()).post('/login').type('form').send({ username: 'brian', password: 'secret', returnTo: '/usstock' });
  assert.equal(good.status, 302);
  assert.equal(good.headers.location, '/usstock');
  assert.match(good.headers['set-cookie'].join('\n'), /brianhub_session=/);

  const external = await request(app()).post('/login').type('form').send({ username: 'brian', password: 'secret', returnTo: 'https://example.com' });
  assert.equal(external.status, 302);
  assert.equal(external.headers.location, '/');
});

test('GET / shows Chinese portal with valid session and document tab', async () => {
  const agent = await loginAgent();
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
  const createRes = await agent.post('/users/create').type('form').send({ username: 'alice', password: 'pass1234', role: 'user' });
  assert.equal(createRes.status, 302);
  assert.equal(createRes.headers.location, '/?tab=users&message=%E7%94%A8%E6%88%B7%E5%B7%B2%E6%96%B0%E5%A2%9E');

  const loginRes = await request(instance).post('/login').type('form').send({ username: 'alice', password: 'pass1234', returnTo: '/' });
  assert.equal(loginRes.status, 302);
});

test('POST /users/:username/status disables a user and password reset changes login password', async () => {
  const instance = app();
  const agent = await loginAgent(instance);
  await agent.post('/users/create').type('form').send({ username: 'alice', password: 'pass1234', role: 'user' });

  const disableRes = await agent.post('/users/alice/status').type('form').send({ status: 'disabled' });
  assert.equal(disableRes.status, 302);
  assert.equal(disableRes.headers.location, '/?tab=users&message=%E7%94%A8%E6%88%B7%E7%8A%B6%E6%80%81%E5%B7%B2%E6%9B%B4%E6%96%B0');

  const disabledLogin = await request(instance).post('/login').type('form').send({ username: 'alice', password: 'pass1234', returnTo: '/' });
  assert.equal(disabledLogin.status, 401);

  await agent.post('/users/alice/status').type('form').send({ status: 'active' });
  const resetRes = await agent.post('/users/alice/password').type('form').send({ password: 'newpass123' });
  assert.equal(resetRes.headers.location, '/?tab=users&message=%E5%AF%86%E7%A0%81%E5%B7%B2%E9%87%8D%E7%BD%AE');
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
  assert.equal(saveRes.headers.location, '/?tab=ai&message=AI+%E6%8E%A5%E5%8F%A3%E9%85%8D%E7%BD%AE%E5%B7%B2%E4%BF%9D%E5%AD%98');

  const publicRes = await agent.get('/?tab=ai');
  assert.match(publicRes.text, /sk-s\.\.\.cret/);
  assert.doesNotMatch(publicRes.text, /sk-secret/);
  assert.equal((await request(instance).get('/internal/ai-config')).status, 401);
  const allowedRes = await request(instance).get('/internal/ai-config').set('X-Internal-Token', 'session-secret');
  assert.equal(allowedRes.body.apiKey, 'sk-secret');
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
  assert.match(index.text, /文档中心/);
  assert.match(index.text, /doc-quick-links/);
  assert.match(index.text, /项目总览/);
  assert.match(index.text, /id="doc-search"/);
  assert.match(index.text, /id="doc-category"/);
  assert.match(index.text, /doc-project-toggle/);
  assert.match(index.text, /doc-core-list/);
  assert.match(index.text, /doc-more-docs/);
  assert.match(index.text, /核心文档/);
  assert.match(index.text, /更多文档/);
  assert.match(index.text, /文档 4 份/);
  assert.match(index.text, /长期记忆/);
  assert.match(index.text, /\.engramory-memory\/MEMORY\.md/);
  assert.match(index.text, /缺少 3 项/);
  assert.match(index.text, /演示项目/);
  assert.match(index.text, /产品说明/);

  const selected = await agent.get('/?tab=docs&project=demo&doc=docs%2FPRD.md');
  assert.equal(selected.status, 200);
  assert.match(selected.text, /<article class="markdown-body">/);
  assert.match(selected.text, /<h1>产品说明<\/h1>/);
  assert.match(selected.text, /<h2>范围<\/h2>/);
  assert.match(selected.text, /PRD 内容/);
});

test('GET / renders success and failure popup notices in Chinese', async () => {
  const agent = await loginAgent();
  const successRes = await agent.get('/?message=保存成功');
  assert.match(successRes.text, /notice-dialog/);
  assert.match(successRes.text, /知道了/);
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
  const logout = await agent.post('/logout');
  assert.equal(logout.status, 302);
  assert.match(logout.headers['set-cookie'].join('\n'), /brianhub_session=;/);
});

test('GET /logout clears session cookie and ignores returnTo', async () => {
  const res = await request(app()).get('/logout?returnTo=https://example.com');
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/');
});
