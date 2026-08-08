const express = require('express');
const cookieParser = require('cookie-parser');
const { createSessionToken, verifySessionToken } = require('./auth');
const { createConfigStore } = require('./configStore');
const { projects } = require('./projects');
const { documentProjects } = require('./documentProjects');
const { createDocumentStore } = require('./documentStore');
const { renderLoginPage, renderPortalPage } = require('./render');
const { normalizeLocale, t } = require('./i18n');

const COOKIE_NAME = 'brianhub_session';
const LOCALE_COOKIE_NAME = 'brianhub_locale';
const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function safeReturnTo(value) {
  if (!value || typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

function redirectWithNotice(res, path, params) {
  const query = new URLSearchParams(params);
  res.redirect(`${path}?${query.toString()}`);
}

function normalizePositiveInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function withTimeout(ms) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return { signal: AbortSignal.timeout(ms) };
  }
  return {};
}

function createApp(config = {}) {
  const portalUsername = config.portalUsername || process.env.PORTAL_USERNAME;
  const portalPassword = config.portalPassword || process.env.PORTAL_PASSWORD;
  const sessionSecret = config.sessionSecret || process.env.PORTAL_SESSION_SECRET;
  const internalToken = config.internalToken || process.env.PORTAL_INTERNAL_TOKEN || sessionSecret;
  const secureCookie = config.secureCookie ?? process.env.NODE_ENV === 'production';
  const maxAgeMs = config.maxAgeMs || DEFAULT_MAX_AGE_MS;
  const fetchImpl = config.fetchImpl || fetch;
  const appProjects = config.projects || projects;
  const docsStore = config.docsStore || createDocumentStore({ projects: config.documentProjects || documentProjects });
  const projectHealthTimeoutMs = config.projectHealthTimeoutMs || 1500;
  const configStore = config.configStore || createConfigStore({
    filePath: config.configPath,
    defaultUsername: portalUsername,
    defaultPassword: portalPassword,
    projectIds: appProjects.map((project) => project.id)
  });

  if (!portalUsername || !portalPassword || !sessionSecret) {
    throw new Error('PORTAL_USERNAME, PORTAL_PASSWORD and PORTAL_SESSION_SECRET are required');
  }

  const app = express();
  app.disable('x-powered-by');
  app.use('/assets', express.static('public', { maxAge: '1h' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  function currentUser(req) {
    const token = req.cookies[COOKIE_NAME];
    const session = verifySessionToken(token, sessionSecret, maxAgeMs);
    if (!session || !session.username) return null;
    return configStore.getUser(session.username);
  }

  function currentLocale(req, user = currentUser(req)) {
    return normalizeLocale(req.cookies[LOCALE_COOKIE_NAME] || user?.locale);
  }

  function isAdmin(user) {
    return user?.role === 'admin';
  }

  function visibleProjectsFor(user) {
    if (isAdmin(user)) return appProjects;
    const allowedIds = new Set(user?.allowedProjects || []);
    return appProjects.filter((project) => allowedIds.has(project.id));
  }

  function allowedTabFor(user, requestedTab) {
    const tab = ['projects', 'users', 'ai', 'notifications', 'docs'].includes(requestedTab) ? requestedTab : 'projects';
    if (isAdmin(user)) return tab;
    return 'projects';
  }

  function requireAdmin(req, res) {
    const user = requireSession(req, res);
    if (!user) return null;
    if (!isAdmin(user)) {
      res.status(403).json({ error: 'Forbidden' });
      return null;
    }
    return user;
  }

  function hasSession(req) {
    return Boolean(currentUser(req));
  }

  function requireSession(req, res) {
    const user = currentUser(req);
    if (!user) {
      res.redirect(`/?returnTo=${encodeURIComponent(safeReturnTo(req.originalUrl))}`);
      return null;
    }
    return user;
  }

  function cookieOptions() {
    return {
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeMs
    };
  }

  function localeCookieOptions() {
    return {
      httpOnly: false,
      secure: secureCookie,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeMs
    };
  }

  function setLocaleCookie(res, locale) {
    res.cookie(LOCALE_COOKIE_NAME, normalizeLocale(locale), localeCookieOptions());
  }

  function resolveAiConfigForInput(input) {
    const current = configStore.getAiConfigInternal();
    return {
      enabled: input.enabled === true || input.enabled === '1' || input.enabled === 'true',
      baseUrl: String(input.baseUrl || current.baseUrl || '').trim(),
      apiKey: String(input.apiKey || '').trim() || current.apiKey,
      model: String(input.model || current.model || '').trim(),
      timeoutSeconds: normalizePositiveInteger(input.timeoutSeconds, current.timeoutSeconds || 120, 10, 600),
      analysisLimit: normalizePositiveInteger(input.analysisLimit, current.analysisLimit || 50, 1, 500)
    };
  }

  async function testAiConfig(aiConfig) {
    if (!aiConfig.enabled) throw new Error('AI 接口未启用');
    if (!aiConfig.baseUrl) throw new Error('接口地址不能为空');
    if (!aiConfig.apiKey) throw new Error('API Key 未配置');
    if (!aiConfig.model) throw new Error('默认模型不能为空');

    const url = `${aiConfig.baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${aiConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1
      }),
      ...withTimeout(aiConfig.timeoutSeconds * 1000)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status || '请求失败'}`);
  }

  async function checkProjectHealth(project) {
    if (!project.healthUrl) return { id: project.id, status: 'unknown', message: '未配置健康检查' };

    try {
      const response = await fetchImpl(project.healthUrl, withTimeout(projectHealthTimeoutMs));
      return {
        id: project.id,
        status: response.ok ? 'ok' : 'error',
        statusCode: response.status,
        message: response.ok ? '正常' : '异常'
      };
    } catch (error) {
      return { id: project.id, status: 'error', message: '异常' };
    }
  }

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/auth/check', (req, res) => {
    const user = currentUser(req);
    if (!user) {
      if (req.query.redirect === '1') {
        const returnTo = safeReturnTo(req.get('X-Forwarded-Uri'));
        res.redirect(`/?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      res.status(401).json({ authenticated: false });
      return;
    }
    res.set('X-BrianHub-User', user.username);
    res.set('X-BrianHub-Locale', currentLocale(req, user));
    res.status(204).end();
  });

  app.get('/', async (req, res) => {
    const user = currentUser(req);
    if (!user) {
      res.status(200).send(renderLoginPage({
        locale: currentLocale(req, null),
        returnTo: safeReturnTo(req.query.returnTo)
      }));
      return;
    }

    const locale = currentLocale(req, user);
    const activeTab = allowedTabFor(user, req.query.tab);
    const visibleProjects = visibleProjectsFor(user);
    const projectHealth = activeTab === 'projects' ? await Promise.all(visibleProjects.map(checkProjectHealth)) : [];
    const documentation = activeTab === 'docs' ? docsStore.listDocuments() : { projects: [] };
    const selectedDocument = activeTab === 'docs' && req.query.project && req.query.doc
      ? docsStore.getDocument(req.query.project, req.query.doc)
      : null;

    res.status(200).send(renderPortalPage({
      projects: visibleProjects,
      projectHealth,
      user,
      locale,
      returnTo: safeReturnTo(req.originalUrl),
      activeTab,
      users: configStore.listUsers(),
      userProjects: appProjects,
      aiConfig: configStore.getAiConfigPublic(),
      notificationConfig: configStore.getNotificationConfigPublic(),
      documentation,
      selectedDocument,
      message: req.query.message,
      error: req.query.error
    }));
  });

  app.get('/health/projects', async (req, res) => {
    const user = requireSession(req, res);
    if (!user) return;
    const statuses = await Promise.all(visibleProjectsFor(user).map(checkProjectHealth));
    res.json(statuses);
  });

  app.get('/docs/index', (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;
    res.json(docsStore.listDocuments());
  });

  app.get('/docs/audit', (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;
    res.json(docsStore.auditDocuments());
  });

  app.get('/docs/view', (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;
    const document = docsStore.getDocument(req.query.project, req.query.path);
    if (!document) {
      res.status(404).json({ error: '文档不存在' });
      return;
    }
    res.json(document);
  });

  app.post('/login', (req, res) => {
    const returnTo = safeReturnTo(req.body.returnTo);
    const user = configStore.verifyUser(req.body.username, req.body.password);
    const locale = currentLocale(req, user);
    if (!user) {
      res.status(401).send(renderLoginPage({ locale, error: t(locale, 'invalidCredentials'), returnTo }));
      return;
    }

    configStore.setUserLocale(user.username, locale);
    setLocaleCookie(res, locale);
    res.cookie(COOKIE_NAME, createSessionToken(sessionSecret, Date.now(), { username: user.username, role: user.role }), cookieOptions());
    res.redirect(returnTo);
  });

  app.post('/locale', (req, res) => {
    const locale = normalizeLocale(req.body.locale);
    const user = currentUser(req);
    if (user) configStore.setUserLocale(user.username, locale);
    setLocaleCookie(res, locale);
    res.redirect(safeReturnTo(req.body.returnTo));
  });

  app.post('/users/create', (req, res) => {
    const user = requireSession(req, res);
    if (!user) return;
    const locale = currentLocale(req, user);
    if (user.role !== 'admin') {
      redirectWithNotice(res, '/', { tab: 'users', error: t(locale, 'adminOnly') });
      return;
    }
    try {
      configStore.createUser({ username: req.body.username, password: req.body.password, role: req.body.role, allowedProjects: req.body.allowedProjects });
      redirectWithNotice(res, '/', { tab: 'users', message: t(locale, 'userCreated') });
    } catch (error) {
      redirectWithNotice(res, '/', { tab: 'users', error: error.message });
    }
  });

  app.post('/users/:username/status', (req, res) => {
    const user = requireSession(req, res);
    if (!user) return;
    const locale = currentLocale(req, user);
    if (user.role !== 'admin') {
      redirectWithNotice(res, '/', { tab: 'users', error: t(locale, 'adminOnly') });
      return;
    }
    try {
      configStore.setUserStatus(req.params.username, req.body.status);
      redirectWithNotice(res, '/', { tab: 'users', message: t(locale, 'userStatusUpdated') });
    } catch (error) {
      redirectWithNotice(res, '/', { tab: 'users', error: error.message });
    }
  });

  app.post('/users/:username/password', (req, res) => {
    const user = requireSession(req, res);
    if (!user) return;
    const locale = currentLocale(req, user);
    if (user.role !== 'admin') {
      redirectWithNotice(res, '/', { tab: 'users', error: t(locale, 'adminOnly') });
      return;
    }
    try {
      configStore.resetPassword(req.params.username, req.body.password);
      redirectWithNotice(res, '/', { tab: 'users', message: t(locale, 'passwordReset') });
    } catch (error) {
      redirectWithNotice(res, '/', { tab: 'users', error: error.message });
    }
  });

  app.post('/users/:username/projects', (req, res) => {
    const user = requireSession(req, res);
    if (!user) return;
    const locale = currentLocale(req, user);
    if (user.role !== 'admin') {
      redirectWithNotice(res, '/', { tab: 'users', error: t(locale, 'adminOnly') });
      return;
    }
    try {
      configStore.setUserProjects(req.params.username, req.body.allowedProjects);
      redirectWithNotice(res, '/', { tab: 'users', message: t(locale, 'modulePermissionsUpdated') });
    } catch (error) {
      redirectWithNotice(res, '/', { tab: 'users', error: error.message });
    }
  });

  app.post('/ai-config', (req, res) => {
    const user = requireSession(req, res);
    if (!user) return;
    const locale = currentLocale(req, user);
    if (user.role !== 'admin') {
      redirectWithNotice(res, '/', { tab: 'ai', error: t(locale, 'adminOnly') });
      return;
    }
    try {
      configStore.saveAiConfig(req.body);
      redirectWithNotice(res, '/', { tab: 'ai', message: t(locale, 'aiConfigSaved') });
    } catch (error) {
      redirectWithNotice(res, '/', { tab: 'ai', error: error.message });
    }
  });

  app.post('/ai-config/test', async (req, res) => {
    const user = requireSession(req, res);
    if (!user) return;
    const locale = currentLocale(req, user);
    if (user.role !== 'admin') {
      redirectWithNotice(res, '/', { tab: 'ai', error: t(locale, 'adminOnly') });
      return;
    }
    try {
      await testAiConfig(resolveAiConfigForInput(req.body));
      redirectWithNotice(res, '/', { tab: 'ai', message: t(locale, 'aiConnectionSucceeded') });
    } catch (error) {
      redirectWithNotice(res, '/', { tab: 'ai', error: `AI 接口连接测试失败：${error.message}` });
    }
  });

  app.post('/notification-config', (req, res) => {
    const user = requireSession(req, res);
    if (!user) return;
    const locale = currentLocale(req, user);
    if (user.role !== 'admin') {
      redirectWithNotice(res, '/', { tab: 'notifications', error: t(locale, 'adminOnly') });
      return;
    }
    try {
      configStore.saveNotificationConfig(req.body);
      redirectWithNotice(res, '/', { tab: 'notifications', message: t(locale, 'notificationConfigSaved') });
    } catch (error) {
      redirectWithNotice(res, '/', { tab: 'notifications', error: error.message });
    }
  });

  app.get('/internal/ai-config', (req, res) => {
    if (!internalToken || req.get('X-Internal-Token') !== internalToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.json(configStore.getAiConfigInternal());
  });

  app.get('/internal/notification-config', (req, res) => {
    if (!internalToken || req.get('X-Internal-Token') !== internalToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.json(configStore.getNotificationConfigInternal());
  });

  app.post('/logout', (req, res) => {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.redirect('/');
  });

  app.get('/logout', (req, res) => {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.redirect('/');
  });

  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port, () => {
    console.log(`BrianHub portal listening on ${port}`);
  });
}

module.exports = { createApp, safeReturnTo, COOKIE_NAME };
