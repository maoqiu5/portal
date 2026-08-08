const fs = require('node:fs');
const path = require('node:path');
const { hashPassword, verifyPasswordHash } = require('./auth');
const { normalizeLocale } = require('./i18n');

const DEFAULT_AI_CONFIG = {
  enabled: false,
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4.1-mini',
  timeoutSeconds: 120,
  analysisLimit: 50
};

const DEFAULT_NOTIFICATION_CONFIG = {
  enabled: false,
  appName: '',
  corpId: '',
  agentId: '',
  secret: '',
  touser: '',
  toparty: '',
  totag: '',
  webhook: '',
  markdownTemplate: '## {{title}}\n{{content}}'
};

const DEFAULT_PROJECT_IDS = [
  'usstock',
  'cnstock',
  'yanqing',
  'maildesk',
  'gps',
  'factsheet',
  'rail-cost',
  'learndesk',
  'nas',
  'homeassistant',
  'translator'
];

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function normalizeRole(role) {
  return role === 'user' ? 'user' : 'admin';
}

function normalizeStatus(status) {
  return status === 'disabled' ? 'disabled' : 'active';
}

function createProjectNormalizer(projectIds = DEFAULT_PROJECT_IDS) {
  const allowedIds = new Set(projectIds);
  return function normalizeProjectIds(value) {
    const rawItems = Array.isArray(value) ? value : value ? [value] : [];
    const seen = new Set();
    return rawItems
      .map((item) => String(item || '').trim())
      .filter((item) => allowedIds.has(item) && !seen.has(item) && seen.add(item));
  };
}

function nowIso() {
  return new Date().toISOString();
}

function maskSecret(secret) {
  if (!secret) return '';
  if (secret.length <= 4) return '****';
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

function normalizePositiveInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function createDefaultConfig(defaultUsername, defaultPassword) {
  const username = normalizeUsername(defaultUsername);
  if (!username || !defaultPassword) {
    throw new Error('Default portal username and password are required');
  }
  const timestamp = nowIso();
  return {
    version: 1,
    users: [
      {
        username,
        passwordHash: hashPassword(defaultPassword),
        role: 'admin',
        status: 'active',
        allowedProjects: [],
        locale: 'en-US',
        createdAt: timestamp,
        updatedAt: timestamp
      }
    ],
    aiConfig: { ...DEFAULT_AI_CONFIG },
    notificationConfig: { ...DEFAULT_NOTIFICATION_CONFIG },
    updatedAt: timestamp
  };
}

function sanitizeConfig(config, defaults) {
  const base = config && typeof config === 'object' ? config : {};
  const users = Array.isArray(base.users) ? base.users : [];
  const normalizedUsers = users
    .map((user) => ({
      username: normalizeUsername(user.username),
      passwordHash: String(user.passwordHash || ''),
      role: normalizeRole(user.role),
      status: normalizeStatus(user.status),
      allowedProjects: user.allowedProjects,
      locale: normalizeLocale(user.locale),
      createdAt: user.createdAt || nowIso(),
      updatedAt: user.updatedAt || nowIso()
    }))
    .filter((user) => user.username && user.passwordHash);

  if (normalizedUsers.length === 0) {
    return createDefaultConfig(defaults.defaultUsername, defaults.defaultPassword);
  }

  return {
    version: 1,
    users: normalizedUsers,
    aiConfig: {
      ...DEFAULT_AI_CONFIG,
      ...(base.aiConfig && typeof base.aiConfig === 'object' ? base.aiConfig : {})
    },
    notificationConfig: {
      ...DEFAULT_NOTIFICATION_CONFIG,
      ...(base.notificationConfig && typeof base.notificationConfig === 'object' ? base.notificationConfig : {})
    },
    updatedAt: base.updatedAt || nowIso()
  };
}

function createConfigStore(options = {}) {
  const filePath = options.filePath || process.env.PORTAL_CONFIG_PATH || '/app/data/portal-config.json';
  const defaults = {
    defaultUsername: options.defaultUsername || process.env.PORTAL_USERNAME,
    defaultPassword: options.defaultPassword || process.env.PORTAL_PASSWORD
  };
  const normalizeProjectIds = createProjectNormalizer(options.projectIds);

  function ensureConfig() {
    if (!fs.existsSync(filePath)) {
      const config = createDefaultConfig(defaults.defaultUsername, defaults.defaultPassword);
      writeConfig(config);
      return config;
    }
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const config = sanitizeConfig(raw, defaults);
    config.users = config.users.map((user) => ({
      ...user,
      allowedProjects: normalizeProjectIds(user.allowedProjects)
    }));
    writeConfig(config);
    return config;
  }

  function readConfig() {
    return ensureConfig();
  }

  function writeConfig(config) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  }

  function updateConfig(mutator) {
    const config = readConfig();
    mutator(config);
    config.updatedAt = nowIso();
    writeConfig(config);
    return config;
  }

  function publicUser(user) {
    const { passwordHash, ...safeUser } = user;
    return {
      ...safeUser,
      allowedProjects: normalizeProjectIds(user.allowedProjects),
      locale: normalizeLocale(user.locale)
    };
  }

  function listUsers() {
    return readConfig().users.map(publicUser);
  }

  function getUser(username) {
    const normalized = normalizeUsername(username);
    const user = readConfig().users.find((item) => item.username === normalized);
    if (!user || user.status !== 'active') return null;
    return publicUser(user);
  }

  function verifyUser(username, password) {
    const normalized = normalizeUsername(username);
    const user = readConfig().users.find((item) => item.username === normalized);
    if (!user || user.status !== 'active' || !verifyPasswordHash(password, user.passwordHash)) return null;
    return publicUser(user);
  }

  function createUser({ username, password, role = 'user', allowedProjects = [], locale = 'en-US' }) {
    const normalized = normalizeUsername(username);
    if (!/^[a-z0-9._-]{3,40}$/.test(normalized)) throw new Error('Invalid username');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters');
    let created;
    updateConfig((config) => {
      if (config.users.some((user) => user.username === normalized)) throw new Error('User already exists');
      const timestamp = nowIso();
      created = {
        username: normalized,
        passwordHash: hashPassword(password),
        role: normalizeRole(role),
        status: 'active',
        allowedProjects: normalizeProjectIds(allowedProjects),
        locale: normalizeLocale(locale),
        createdAt: timestamp,
        updatedAt: timestamp
      };
      config.users.push(created);
    });
    return publicUser(created);
  }

  function setUserStatus(username, status) {
    const normalized = normalizeUsername(username);
    updateConfig((config) => {
      const user = config.users.find((item) => item.username === normalized);
      if (!user) throw new Error('User not found');
      user.status = normalizeStatus(status);
      user.updatedAt = nowIso();
    });
  }

  function resetPassword(username, password) {
    const normalized = normalizeUsername(username);
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters');
    updateConfig((config) => {
      const user = config.users.find((item) => item.username === normalized);
      if (!user) throw new Error('User not found');
      user.passwordHash = hashPassword(password);
      user.updatedAt = nowIso();
    });
  }

  function setUserProjects(username, allowedProjects) {
    const normalized = normalizeUsername(username);
    updateConfig((config) => {
      const user = config.users.find((item) => item.username === normalized);
      if (!user) throw new Error('User not found');
      user.allowedProjects = normalizeProjectIds(allowedProjects);
      user.updatedAt = nowIso();
    });
  }

  function setUserLocale(username, locale) {
    const normalized = normalizeUsername(username);
    updateConfig((config) => {
      const user = config.users.find((item) => item.username === normalized);
      if (!user) throw new Error('User not found');
      user.locale = normalizeLocale(locale);
      user.updatedAt = nowIso();
    });
  }

  function getAiConfigInternal() {
    return { ...DEFAULT_AI_CONFIG, ...readConfig().aiConfig };
  }

  function getAiConfigPublic() {
    const config = getAiConfigInternal();
    return {
      enabled: Boolean(config.enabled),
      baseUrl: config.baseUrl,
      model: config.model,
      timeoutSeconds: config.timeoutSeconds,
      analysisLimit: config.analysisLimit,
      hasApiKey: Boolean(config.apiKey),
      apiKeyMask: maskSecret(config.apiKey)
    };
  }

  function saveAiConfig(input) {
    updateConfig((config) => {
      const current = { ...DEFAULT_AI_CONFIG, ...config.aiConfig };
      config.aiConfig = {
        enabled: input.enabled === true || input.enabled === '1' || input.enabled === 'true',
        baseUrl: String(input.baseUrl || DEFAULT_AI_CONFIG.baseUrl).trim() || DEFAULT_AI_CONFIG.baseUrl,
        apiKey: String(input.apiKey || '').trim() || current.apiKey,
        model: String(input.model || DEFAULT_AI_CONFIG.model).trim() || DEFAULT_AI_CONFIG.model,
        timeoutSeconds: normalizePositiveInteger(input.timeoutSeconds, DEFAULT_AI_CONFIG.timeoutSeconds, 10, 600),
        analysisLimit: normalizePositiveInteger(input.analysisLimit, DEFAULT_AI_CONFIG.analysisLimit, 1, 500)
      };
    });
    return getAiConfigPublic();
  }

  function getNotificationConfigInternal() {
    return { ...DEFAULT_NOTIFICATION_CONFIG, ...readConfig().notificationConfig };
  }

  function getNotificationConfigPublic() {
    const config = getNotificationConfigInternal();
    return {
      enabled: Boolean(config.enabled),
      appName: config.appName,
      corpId: config.corpId,
      agentId: config.agentId,
      touser: config.touser,
      toparty: config.toparty,
      totag: config.totag,
      webhook: config.webhook,
      markdownTemplate: config.markdownTemplate,
      hasSecret: Boolean(config.secret),
      secretMask: maskSecret(config.secret)
    };
  }

  function saveNotificationConfig(input) {
    updateConfig((config) => {
      const current = { ...DEFAULT_NOTIFICATION_CONFIG, ...config.notificationConfig };
      config.notificationConfig = {
        enabled: input.enabled === true || input.enabled === '1' || input.enabled === 'true',
        appName: String(input.appName || '').trim(),
        corpId: String(input.corpId || '').trim(),
        agentId: String(input.agentId || '').trim(),
        secret: String(input.secret || '').trim() || current.secret,
        touser: String(input.touser || '').trim(),
        toparty: String(input.toparty || '').trim(),
        totag: String(input.totag || '').trim(),
        webhook: String(input.webhook || '').trim(),
        markdownTemplate: String(input.markdownTemplate || '').trim() || DEFAULT_NOTIFICATION_CONFIG.markdownTemplate
      };
    });
    return getNotificationConfigPublic();
  }

  return {
    readConfig,
    listUsers,
    getUser,
    verifyUser,
    createUser,
    setUserStatus,
    resetPassword,
    setUserProjects,
    setUserLocale,
    getAiConfigInternal,
    getAiConfigPublic,
    saveAiConfig,
    getNotificationConfigInternal,
    getNotificationConfigPublic,
    saveNotificationConfig
  };
}

module.exports = {
  createConfigStore,
  maskSecret
};
