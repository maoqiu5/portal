const { normalizeLocale, t, localizeProject } = require('./i18n');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function layout(title, body, locale = 'en-US') {
  return `<!doctype html>
<html lang="${normalizeLocale(locale)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>${body}</body>
</html>`;
}

function renderMarkdown(markdown = '') {
  const lines = String(markdown).split(/\r?\n/);
  const html = [];
  let paragraph = [];
  let listItems = [];
  let codeLines = [];
  let inCode = false;

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${escapeHtml(paragraph.join(' '))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!listItems.length) return;
    html.push(`<ul>${listItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`);
    listItems = [];
  }

  function flushCode() {
    if (!codeLines.length) return;
    html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    codeLines = [];
  }

  for (const line of lines) {
    if (/^```/.test(line)) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      html.push(`<h${heading[1].length}>${escapeHtml(heading[2].trim())}</h${heading[1].length}>`);
      continue;
    }

    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      flushParagraph();
      listItems.push(bullet[1].trim());
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushCode();
  return html.join('\n');
}

function renderLanguageSwitcher(locale, returnTo) {
  const normalized = normalizeLocale(locale);
  return `
    <form method="post" action="/locale" class="language-switcher" aria-label="${escapeHtml(t(normalized, 'language'))}">
      <input type="hidden" name="returnTo" value="${escapeHtml(returnTo)}">
      <button type="submit" name="locale" value="zh-CN" class="${normalized === 'zh-CN' ? 'active' : ''}" aria-pressed="${normalized === 'zh-CN'}">中文</button>
      <button type="submit" name="locale" value="en-US" class="${normalized === 'en-US' ? 'active' : ''}" aria-pressed="${normalized === 'en-US'}">English</button>
    </form>`;
}

function renderLoginPage({ locale = 'en-US', error = '', returnTo = '/' }) {
  const normalized = normalizeLocale(locale);
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : '';
  return layout(t(normalized, 'portalTitle'), `
    <main class="login-shell">
      <div class="login-background" aria-hidden="true"></div>
      <section class="login-panel">
        <div class="login-panel-head">
          <p class="eyebrow">BrianHub</p>
          ${renderLanguageSwitcher(normalized, returnTo)}
        </div>
        <h1>${t(normalized, 'signInTitle')}</h1>
        ${errorHtml}
        <form method="post" action="/login" class="login-form">
          <input type="hidden" name="returnTo" value="${escapeHtml(returnTo)}">
          <label for="username">${t(normalized, 'username')}</label>
          <input id="username" name="username" type="text" autocomplete="username" required autofocus>
          <label for="password">${t(normalized, 'password')}</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required>
          <button type="submit">${t(normalized, 'signIn')}</button>
        </form>
      </section>
    </main>`, normalized);
}

function renderNotice({ locale = 'en-US', message = '', error = '' }) {
  const normalized = normalizeLocale(locale);
  const text = error || message;
  if (!text) return '';
  const tone = error ? 'error' : 'success';
  const title = error ? t(normalized, 'operationFailed') : t(normalized, 'operationSucceeded');
  return `
    <div class="notice-backdrop">
      <section class="notice-dialog ${tone}" role="dialog" aria-live="polite" aria-label="${title}">
        <div>
          <h2>${title}</h2>
          <p>${escapeHtml(text)}</p>
        </div>
        <button type="button" class="secondary" onclick="this.closest('.notice-backdrop').remove()">${t(normalized, 'dismiss')}</button>
      </section>
    </div>`;
}

function renderHealthBadge(health, locale = 'en-US') {
  const normalized = normalizeLocale(locale);
  if (!health) return `<span class="health-badge health-unknown">${t(normalized, 'notChecked')}</span>`;
  const labels = {
    ok: t(normalized, 'healthy'),
    error: t(normalized, 'unhealthy'),
    unknown: t(normalized, 'notConfigured')
  };
  const status = ['ok', 'error', 'unknown'].includes(health.status) ? health.status : 'unknown';
  const detail = health.statusCode ? `，HTTP ${health.statusCode}` : '';
  return `<span class="health-badge health-${status}" title="${escapeHtml(health.message || labels[status])}${detail}">${labels[status]}</span>`;
}

function renderProjectGrid(projects, projectHealth = [], locale = 'en-US') {
  const normalized = normalizeLocale(locale);
  const healthById = new Map(projectHealth.map((item) => [item.id, item]));
  const cards = projects.map((project) => {
    const localizedProject = localizeProject(project, normalized);
    return `
    <a class="project-card" href="${escapeHtml(project.path)}">
      <span class="project-meta"><span class="project-id">${escapeHtml(project.id)}</span>${renderHealthBadge(healthById.get(project.id), normalized)}</span>
      <strong>${escapeHtml(localizedProject.name)}</strong>
      <span>${escapeHtml(localizedProject.description)}</span>
    </a>`;
  }).join('');
  return `<section class="project-grid">${cards}</section>`;
}

function renderProjectCheckboxes(projects, selectedIds = [], fieldName = 'allowedProjects') {
  const selected = new Set(selectedIds);
  return `
        <div class="project-permissions">
          ${projects.map((project) => `
          <label class="check-row">
            <input type="checkbox" name="${escapeHtml(fieldName)}" value="${escapeHtml(project.id)}"${selected.has(project.id) ? ' checked' : ''}>
            <span>${escapeHtml(project.name)}</span>
          </label>`).join('')}
        </div>`;
}

function renderUsersPanel(users, userProjects = [], locale = 'en-US') {
  const normalized = normalizeLocale(locale);
  const rows = users.map((user) => {
    const statusLabel = user.status === 'active' ? t(normalized, 'enable') : t(normalized, 'disable');
    const roleLabel = user.role === 'admin' ? t(normalized, 'administrator') : t(normalized, 'standardUser');
    const projectForm = user.role === 'admin'
      ? `<span class="muted-line">${t(normalized, 'allModulesVisible')}</span>`
      : `
        <form method="post" action="/users/${encodeURIComponent(user.username)}/projects" class="permission-form">
          ${renderProjectCheckboxes(userProjects, user.allowedProjects)}
          <button type="submit" class="secondary">${t(normalized, 'saveModules')}</button>
        </form>`;
    return `
    <tr>
      <td><strong>${escapeHtml(user.username)}</strong></td>
      <td>${roleLabel}</td>
      <td>${statusLabel}</td>
      <td>${projectForm}</td>
      <td>
        <form method="post" action="/users/${encodeURIComponent(user.username)}/status" class="inline-form">
          <input type="hidden" name="status" value="${user.status === 'active' ? 'disabled' : 'active'}">
          <button type="submit" class="secondary">${user.status === 'active' ? t(normalized, 'disable') : t(normalized, 'enable')}</button>
        </form>
      </td>
      <td>
        <form method="post" action="/users/${encodeURIComponent(user.username)}/password" class="inline-form">
          <input name="password" type="password" placeholder="${t(normalized, 'newPassword')}" minlength="6" required>
          <button type="submit" class="secondary">${t(normalized, 'resetPassword')}</button>
        </form>
      </td>
    </tr>`;
  }).join('');

  return `
    <section class="panel">
      <div class="section-head">
        <h2>${t(normalized, 'userManagement')}</h2>
        <p>${t(normalized, 'userManagementDescription')}</p>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>${t(normalized, 'user')}</th><th>${t(normalized, 'role')}</th><th>${t(normalized, 'status')}</th><th>${t(normalized, 'visibleModules')}</th><th>${t(normalized, 'enable')}/${t(normalized, 'disable')}</th><th>${t(normalized, 'resetPassword')}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <form method="post" action="/users/create" class="form-grid">
        <h3>${t(normalized, 'addUser')}</h3>
        <label>${t(normalized, 'username')}<input name="username" autocomplete="off" required></label>
        <label>${t(normalized, 'initialPassword')}<input name="password" type="password" minlength="6" required></label>
        <label>${t(normalized, 'role')}<select name="role"><option value="user">${t(normalized, 'standardUser')}</option><option value="admin">${t(normalized, 'administrator')}</option></select></label>
        <fieldset class="form-fieldset">
          <legend>${t(normalized, 'visibleModules')}</legend>
          ${renderProjectCheckboxes(userProjects)}
        </fieldset>
        <button type="submit">${t(normalized, 'addUser')}</button>
      </form>
    </section>`;
}

function renderAiPanel(aiConfig, locale = 'en-US') {
  const normalized = normalizeLocale(locale);
  return `
    <section class="panel">
      <div class="section-head">
        <h2>${t(normalized, 'aiInterface')}</h2>
        <p>${t(normalized, 'aiDescription')}</p>
      </div>
      <form method="post" action="/ai-config" class="form-grid">
        <label>${t(normalized, 'status')}
          <select name="enabled">
            <option value="1"${aiConfig.enabled ? ' selected' : ''}>${t(normalized, 'enabled')}</option>
            <option value="0"${aiConfig.enabled ? '' : ' selected'}>${t(normalized, 'disabled')}</option>
          </select>
        </label>
        <label>${t(normalized, 'apiBaseUrl')}<input name="baseUrl" value="${escapeHtml(aiConfig.baseUrl)}" required></label>
        <label>API Key<input name="apiKey" type="password" placeholder="${escapeHtml(aiConfig.apiKeyMask || '留空则保留当前 Key')}"></label>
        <label>${t(normalized, 'defaultModel')}<input name="model" value="${escapeHtml(aiConfig.model)}" required></label>
        <label>${t(normalized, 'timeoutSeconds')}<input name="timeoutSeconds" type="number" min="10" max="600" value="${escapeHtml(aiConfig.timeoutSeconds)}"></label>
        <label>${t(normalized, 'analysisLimit')}<input name="analysisLimit" type="number" min="1" max="500" value="${escapeHtml(aiConfig.analysisLimit)}"></label>
        <button type="submit">${t(normalized, 'saveAiConfig')}</button>
        <button type="submit" class="secondary" formaction="/ai-config/test">${t(normalized, 'testConnection')}</button>
      </form>
      <p class="muted-line">${t(normalized, 'currentKey')}：${aiConfig.hasApiKey ? escapeHtml(aiConfig.apiKeyMask) : t(normalized, 'noKeyConfigured')}</p>
    </section>`;
}

function auditLabel(audit, locale = 'en-US') {
  const normalized = normalizeLocale(locale);
  if (!audit) return { className: 'doc-status unknown', text: t(normalized, 'unknown') };
  if (audit.status === 'ok') return { className: 'doc-status ok', text: t(normalized, 'complete') };
  if (audit.status === 'risk') return { className: 'doc-status risk', text: t(normalized, 'risk', audit.risks.length) };
  return { className: 'doc-status missing', text: t(normalized, 'missing', audit.missingRequired.length) };
}

const CORE_DOC_PATHS = new Set([
  'README.md',
  'docs/README.md',
  'docs/PRD.md',
  'docs/DEPLOYMENT.md',
  'docs/CHANGELOG.md',
  'docs/HANDOFF.md'
]);

function renderDocLink(project, doc) {
  return `
        <a class="doc-link" data-category="${escapeHtml(doc.category)}" href="/?tab=docs&project=${encodeURIComponent(project.id)}&doc=${encodeURIComponent(doc.path)}">
          <strong>${escapeHtml(doc.title)}</strong>
          <span>${escapeHtml(doc.category)} · ${escapeHtml(doc.path)}</span>
          <time datetime="${escapeHtml(doc.updatedAt)}">${escapeHtml(new Date(doc.updatedAt).toLocaleString('zh-CN', { hour12: false }))}</time>
        </a>`;
}

function renderDocsPanel(documentation = { projects: [] }, selectedDocument = null, locale = 'en-US') {
  const normalized = normalizeLocale(locale);
  const projects = documentation.projects || [];
  const categories = [...new Set(projects.flatMap((project) => project.documents.map((doc) => doc.category)))].sort();
  const categoryOptions = categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
  const selectedProjectId = selectedDocument?.project?.id || projects[0]?.id || '';
  const quickLinks = [
    ['projectOverview', 'portal', 'docs/BRIANHUB_PROJECTS.md'],
    ['newProjectOnboarding', 'portal', 'docs/NEW_PROJECT_ONBOARDING_PROMPT.md'],
    ['developmentStandard', 'portal', 'docs/BRIANHUB_DEVELOPMENT_STANDARD.md'],
    ['gatewaySsoAi', 'portal', 'docs/BRIANHUB_GATEWAY_AND_SSO.md'],
    ['documentationAudit', 'portal', 'docs/NEW_PROJECT_DOCUMENTATION_REQUIREMENTS.md']
  ].map(([key, projectId, docPath]) => `
        <a href="/?tab=docs&project=${encodeURIComponent(projectId)}&doc=${encodeURIComponent(docPath)}">${escapeHtml(t(normalized, key))}</a>`).join('');

  const projectBlocks = projects.map((project) => {
    const audit = auditLabel(project.audit, normalized);
    const coreDocs = project.documents.filter((doc) => CORE_DOC_PATHS.has(doc.path));
    const extraDocs = project.documents.filter((doc) => !CORE_DOC_PATHS.has(doc.path));
    const coreLinks = coreDocs.length
      ? coreDocs.map((doc) => renderDocLink(project, doc)).join('')
      : `<p class="muted-line">${t(normalized, 'noCoreDocuments')}</p>`;
    const extraLinks = extraDocs.length
      ? extraDocs.map((doc) => renderDocLink(project, doc)).join('')
      : `<p class="muted-line">${t(normalized, 'noMoreDocuments')}</p>`;
    const openAttr = project.id === selectedProjectId ? ' open' : '';
    return `
      <details class="doc-project"${openAttr}>
        <summary class="doc-project-toggle">
          <span>
            <strong>${escapeHtml(project.name)}</strong>
            <small>${t(normalized, 'documentsCount', project.documents.length)}</small>
          </span>
          <span class="${audit.className}">${audit.text}</span>
        </summary>
        <div class="doc-project-body">
          <div class="doc-section-label">${t(normalized, 'coreDocuments')}</div>
          <div class="doc-list doc-core-list">${coreLinks}</div>
          <details class="doc-more-docs"${extraDocs.length ? '' : ' open'}>
            <summary>${t(normalized, 'moreDocumentsCount', extraDocs.length)}</summary>
            <div class="doc-list">${extraLinks}</div>
          </details>
        </div>
      </details>`;
  }).join('');

  const content = selectedDocument ? `
    <aside class="doc-viewer">
      <div class="section-head">
        <h2>${escapeHtml(selectedDocument.document.title)}</h2>
        <p>${escapeHtml(selectedDocument.project.name)} · ${escapeHtml(selectedDocument.document.path)}</p>
      </div>
      <article class="markdown-body">${renderMarkdown(selectedDocument.content)}</article>
    </aside>` : `
    <aside class="doc-viewer empty">
      <h2>${t(normalized, 'selectDocument')}</h2>
      <p class="muted-line">${t(normalized, 'selectDocumentDescription')}</p>
    </aside>`;

  return `
    <section class="panel docs-panel">
      <div class="section-head">
        <h2>${t(normalized, 'documents')}</h2>
        <p>${t(normalized, 'documentsDescription')}</p>
      </div>
      <nav class="doc-quick-links" aria-label="${escapeHtml(t(normalized, 'quickLinks'))}">${quickLinks}</nav>
      <div class="doc-tools">
        <label class="doc-search">${t(normalized, 'searchDocuments')}<input type="search" id="doc-search" placeholder="${escapeHtml(t(normalized, 'searchDocuments'))}"></label>
        <label class="doc-filter">${t(normalized, 'documentCategory')}<select id="doc-category"><option value="">${t(normalized, 'allCategories')}</option>${categoryOptions}</select></label>
      </div>
      <div class="docs-layout">
        <div class="docs-index">${projectBlocks}</div>
        ${content}
      </div>
      <script>
        const docSearch = document.getElementById('doc-search');
        const docCategory = document.getElementById('doc-category');
        function applyDocFilters() {
          const keyword = docSearch ? docSearch.value.trim().toLowerCase() : '';
          const category = docCategory ? docCategory.value : '';
          document.querySelectorAll('.doc-link').forEach((link) => {
            const matchesKeyword = !keyword || link.textContent.toLowerCase().includes(keyword);
            const matchesCategory = !category || link.dataset.category === category;
            link.hidden = !matchesKeyword || !matchesCategory;
          });
          document.querySelectorAll('.doc-project').forEach((project) => {
            const links = Array.from(project.querySelectorAll('.doc-link'));
            const hasVisible = links.some((link) => !link.hidden);
            project.hidden = links.length > 0 && !hasVisible;
            if ((keyword || category) && hasVisible) project.open = true;
          });
        }
        if (docSearch) docSearch.addEventListener('input', applyDocFilters);
        if (docCategory) docCategory.addEventListener('change', applyDocFilters);
      </script>
    </section>`;
}

function renderPortalPage({ projects, projectHealth = [], user, locale = 'en-US', returnTo = '/', activeTab = 'projects', users = [], userProjects = [], aiConfig, documentation, selectedDocument, message = '', error = '' }) {
  const normalized = normalizeLocale(locale);
  const tab = ['projects', 'users', 'ai', 'docs'].includes(activeTab) ? activeTab : 'projects';
  const body = tab === 'users'
    ? renderUsersPanel(users, userProjects, normalized)
    : tab === 'ai'
      ? renderAiPanel(aiConfig, normalized)
      : tab === 'docs'
        ? renderDocsPanel(documentation, selectedDocument, normalized)
        : renderProjectGrid(projects, projectHealth, normalized);
  const roleLabel = user.role === 'admin' ? t(normalized, 'administrator') : t(normalized, 'standardUser');

  return layout(t(normalized, 'portalTitle'), `
    <main class="portal-shell">
      <header class="portal-header">
        <div>
          <p class="eyebrow">BrianHub</p>
          <h1>${t(normalized, 'projects')}</h1>
          <p class="muted-line">${escapeHtml(user.username)} · ${roleLabel}</p>
        </div>
        <div class="header-actions">
          ${renderLanguageSwitcher(normalized, returnTo)}
          <form method="post" action="/logout"><button type="submit" class="secondary">${t(normalized, 'signOut')}</button></form>
        </div>
      </header>
      <nav class="portal-tabs">
        <a class="${tab === 'projects' ? 'active' : ''}" href="/">${t(normalized, 'projects')}</a>
        ${user.role === 'admin' ? `<a class="${tab === 'users' ? 'active' : ''}" href="/?tab=users">${t(normalized, 'users')}</a>` : ''}
        ${user.role === 'admin' ? `<a class="${tab === 'ai' ? 'active' : ''}" href="/?tab=ai">${t(normalized, 'ai')}</a>` : ''}
        ${user.role === 'admin' ? `<a class="${tab === 'docs' ? 'active' : ''}" href="/?tab=docs">${t(normalized, 'documents')}</a>` : ''}
      </nav>
      ${renderNotice({ locale: normalized, message, error })}
      ${body}
    </main>`, normalized);
}

module.exports = { escapeHtml, renderLoginPage, renderPortalPage, renderMarkdown };
