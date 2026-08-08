const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  createConfigStore,
  maskSecret
} = require('../src/configStore');

function tempConfigPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-config-'));
  return path.join(dir, 'portal-config.json');
}

test('config store initializes default admin user from env', () => {
  const store = createConfigStore({
    filePath: tempConfigPath(),
    defaultUsername: 'brian',
    defaultPassword: 'secret'
  });

  const config = store.readConfig();
  assert.equal(config.users.length, 1);
  assert.equal(config.users[0].username, 'brian');
  assert.equal(config.users[0].role, 'admin');
  assert.equal(config.users[0].status, 'active');
  assert.equal(config.users[0].locale, 'en-US');
  assert.equal(store.verifyUser('brian', 'secret')?.role, 'admin');
  assert.equal(store.verifyUser('brian', 'secret')?.locale, 'en-US');
  assert.equal(store.verifyUser('brian', 'wrong'), null);
});

test('config store manages users without exposing password hashes in list', () => {
  const store = createConfigStore({
    filePath: tempConfigPath(),
    defaultUsername: 'brian',
    defaultPassword: 'secret'
  });

  store.createUser({ username: 'alice', password: 'pass1234', role: 'user', allowedProjects: ['rail-cost'] });
  store.setUserStatus('alice', 'disabled');
  assert.equal(store.verifyUser('alice', 'pass1234'), null);

  store.resetPassword('alice', 'nextpass');
  store.setUserStatus('alice', 'active');
  const verified = store.verifyUser('alice', 'nextpass');
  assert.equal(verified?.username, 'alice');
  assert.deepEqual(verified.allowedProjects, ['rail-cost']);
  assert.equal(verified.locale, 'en-US');
  const listed = store.listUsers().find((user) => user.username === 'alice');
  assert.equal(listed.passwordHash, undefined);
  assert.deepEqual(listed.allowedProjects, ['rail-cost']);
  assert.equal(listed.locale, 'en-US');
});

test('config store updates user locale and falls back to English for unknown values', () => {
  const store = createConfigStore({
    filePath: tempConfigPath(),
    defaultUsername: 'brian',
    defaultPassword: 'secret'
  });

  store.setUserLocale('brian', 'zh-CN');
  assert.equal(store.verifyUser('brian', 'secret').locale, 'zh-CN');
  assert.equal(store.listUsers().find((user) => user.username === 'brian').locale, 'zh-CN');

  store.setUserLocale('brian', 'fr-FR');
  assert.equal(store.verifyUser('brian', 'secret').locale, 'en-US');
});

test('config store updates user project permissions', () => {
  const store = createConfigStore({
    filePath: tempConfigPath(),
    defaultUsername: 'brian',
    defaultPassword: 'secret'
  });

  store.createUser({ username: 'alice', password: 'pass1234', role: 'user', allowedProjects: ['rail-cost', 'nas'] });
  store.setUserProjects('alice', ['rail-cost', 'unknown', 'rail-cost']);

  assert.deepEqual(store.verifyUser('alice', 'pass1234').allowedProjects, ['rail-cost']);
  assert.deepEqual(store.listUsers().find((user) => user.username === 'alice').allowedProjects, ['rail-cost']);
});

test('config store saves ai config while preserving existing api key', () => {
  const store = createConfigStore({
    filePath: tempConfigPath(),
    defaultUsername: 'brian',
    defaultPassword: 'secret'
  });

  store.saveAiConfig({
    enabled: true,
    baseUrl: 'https://api.example.com/v1',
    apiKey: 'sk-secret',
    model: 'gpt-test',
    timeoutSeconds: 180,
    analysisLimit: 25
  });

  store.saveAiConfig({
    enabled: false,
    baseUrl: 'https://api.next.com/v1',
    apiKey: '',
    model: 'gpt-next',
    timeoutSeconds: 60,
    analysisLimit: 5
  });

  const internal = store.getAiConfigInternal();
  assert.equal(internal.enabled, false);
  assert.equal(internal.baseUrl, 'https://api.next.com/v1');
  assert.equal(internal.apiKey, 'sk-secret');
  assert.equal(internal.model, 'gpt-next');
  assert.equal(internal.timeoutSeconds, 60);
  assert.equal(internal.analysisLimit, 5);

  const publicConfig = store.getAiConfigPublic();
  assert.equal(publicConfig.apiKey, undefined);
  assert.equal(publicConfig.hasApiKey, true);
  assert.equal(publicConfig.apiKeyMask, 'sk-s...cret');
});

test('config store saves notification config while preserving existing wecom secret', () => {
  const store = createConfigStore({
    filePath: tempConfigPath(),
    defaultUsername: 'brian',
    defaultPassword: 'secret'
  });

  store.saveNotificationConfig({
    enabled: true,
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

  store.saveNotificationConfig({
    enabled: false,
    appName: 'Daily Notice',
    corpId: 'ww-next',
    agentId: '1000003',
    secret: '',
    touser: '@all',
    toparty: '',
    totag: '',
    webhook: '',
    markdownTemplate: '{{content}}'
  });

  const internal = store.getNotificationConfigInternal();
  assert.equal(internal.enabled, false);
  assert.equal(internal.appName, 'Daily Notice');
  assert.equal(internal.corpId, 'ww-next');
  assert.equal(internal.agentId, '1000003');
  assert.equal(internal.secret, 'wecom-secret');
  assert.equal(internal.touser, '@all');
  assert.equal(internal.toparty, '');
  assert.equal(internal.totag, '');
  assert.equal(internal.webhook, '');
  assert.equal(internal.markdownTemplate, '{{content}}');

  const publicConfig = store.getNotificationConfigPublic();
  assert.equal(publicConfig.secret, undefined);
  assert.equal(publicConfig.hasSecret, true);
  assert.equal(publicConfig.secretMask, 'weco...cret');
});

test('maskSecret hides short and empty secrets', () => {
  assert.equal(maskSecret(''), '');
  assert.equal(maskSecret('abcd'), '****');
  assert.equal(maskSecret('sk-1234567890'), 'sk-1...7890');
});
