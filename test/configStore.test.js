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
  assert.equal(store.verifyUser('brian', 'secret')?.role, 'admin');
  assert.equal(store.verifyUser('brian', 'wrong'), null);
});

test('config store manages users without exposing password hashes in list', () => {
  const store = createConfigStore({
    filePath: tempConfigPath(),
    defaultUsername: 'brian',
    defaultPassword: 'secret'
  });

  store.createUser({ username: 'alice', password: 'pass1234', role: 'user' });
  store.setUserStatus('alice', 'disabled');
  assert.equal(store.verifyUser('alice', 'pass1234'), null);

  store.resetPassword('alice', 'nextpass');
  store.setUserStatus('alice', 'active');
  assert.equal(store.verifyUser('alice', 'nextpass')?.username, 'alice');
  assert.equal(store.listUsers().find((user) => user.username === 'alice').passwordHash, undefined);
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

test('maskSecret hides short and empty secrets', () => {
  assert.equal(maskSecret(''), '');
  assert.equal(maskSecret('abcd'), '****');
  assert.equal(maskSecret('sk-1234567890'), 'sk-1...7890');
});
