function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function layout(title, body) {
  return `<!doctype html>
<html lang="zh-CN">
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

function renderLoginPage({ error = '', returnTo = '/' }) {
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : '';
  return layout('BrianHub 登录', `
    <main class="login-shell">
      <div class="login-background" aria-hidden="true"></div>
      <section class="login-panel">
        <p class="eyebrow">BrianHub</p>
        <h1>登录 BrianHub</h1>
        <p class="login-subtitle">统一进入美股、A 股、邮件、GPS 和翻译工具。</p>
        ${errorHtml}
        <form method="post" action="/login" class="login-form">
          <input type="hidden" name="returnTo" value="${escapeHtml(returnTo)}">
          <label for="username">用户名</label>
          <input id="username" name="username" type="text" autocomplete="username" required autofocus>
          <label for="password">密码</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required>
          <button type="submit">登录</button>
        </form>
      </section>
    </main>`);
}

function renderNotice({ message = '', error = '' }) {
  const text = error || message;
  if (!text) return '';
  const tone = error ? 'error' : 'success';
  const title = error ? '操作失败' : '操作成功';
  return `
    <div class="notice-backdrop">
      <section class="notice-dialog ${tone}" role="dialog" aria-live="polite" aria-label="${title}">
        <div>
          <h2>${title}</h2>
          <p>${escapeHtml(text)}</p>
        </div>
        <button type="button" class="secondary" onclick="this.closest('.notice-backdrop').remove()">知道了</button>
      </section>
    </div>`;
}

function renderHealthBadge(health) {
  if (!health) return '<span class="health-badge health-unknown">未检测</span>';
  const labels = { ok: '正常', error: '异常', unknown: '未配置' };
  const status = ['ok', 'error', 'unknown'].includes(health.status) ? health.status : 'unknown';
  const detail = health.statusCode ? `，HTTP ${health.statusCode}` : '';
  return `<span class="health-badge health-${status}" title="${escapeHtml(health.message || labels[status])}${detail}">${labels[status]}</span>`;
}

function renderProjectGrid(projects, projectHealth = []) {
  const healthById = new Map(projectHealth.map((item) => [item.id, item]));
  const cards = projects.map((project) => `
    <a class="project-card" href="${escapeHtml(project.path)}">
      <span class="project-meta"><span class="project-id">${escapeHtml(project.id)}</span>${renderHealthBadge(healthById.get(project.id))}</span>
      <strong>${escapeHtml(project.name)}</strong>
      <span>${escapeHtml(project.description)}</span>
    </a>`).join('');
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

function renderUsersPanel(users, userProjects = []) {
  const rows = users.map((user) => {
    const statusLabel = user.status === 'active' ? '启用' : '停用';
    const roleLabel = user.role === 'admin' ? '管理员' : '普通用户';
    const projectForm = user.role === 'admin'
      ? '<span class="muted-line">管理员默认可见全部模块</span>'
      : `
        <form method="post" action="/users/${encodeURIComponent(user.username)}/projects" class="permission-form">
          ${renderProjectCheckboxes(userProjects, user.allowedProjects)}
          <button type="submit" class="secondary">保存模块</button>
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
          <button type="submit" class="secondary">${user.status === 'active' ? '停用' : '启用'}</button>
        </form>
      </td>
      <td>
        <form method="post" action="/users/${encodeURIComponent(user.username)}/password" class="inline-form">
          <input name="password" type="password" placeholder="新密码" minlength="6" required>
          <button type="submit" class="secondary">重置</button>
        </form>
      </td>
    </tr>`;
  }).join('');

  return `
    <section class="panel">
      <div class="section-head">
        <h2>用户管理</h2>
        <p>门户统一维护用户；各项目通过门户会话接收身份。</p>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>用户</th><th>角色</th><th>状态</th><th>可见模块</th><th>启停</th><th>重置密码</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <form method="post" action="/users/create" class="form-grid">
        <h3>新增用户</h3>
        <label>用户名<input name="username" autocomplete="off" required></label>
        <label>初始密码<input name="password" type="password" minlength="6" required></label>
        <label>角色<select name="role"><option value="user">普通用户</option><option value="admin">管理员</option></select></label>
        <fieldset class="form-fieldset">
          <legend>可见模块</legend>
          ${renderProjectCheckboxes(userProjects)}
        </fieldset>
        <button type="submit">新增用户</button>
      </form>
    </section>`;
}

function renderAiPanel(aiConfig) {
  return `
    <section class="panel">
      <div class="section-head">
        <h2>AI 接口</h2>
        <p>统一保存各项目后续读取的 AI API 参数；API Key 只在服务端保存。</p>
      </div>
      <form method="post" action="/ai-config" class="form-grid">
        <label>启用状态
          <select name="enabled">
            <option value="1"${aiConfig.enabled ? ' selected' : ''}>开启</option>
            <option value="0"${aiConfig.enabled ? '' : ' selected'}>关闭</option>
          </select>
        </label>
        <label>接口地址<input name="baseUrl" value="${escapeHtml(aiConfig.baseUrl)}" required></label>
        <label>API Key<input name="apiKey" type="password" placeholder="${escapeHtml(aiConfig.apiKeyMask || '留空则保留当前 Key')}"></label>
        <label>默认模型<input name="model" value="${escapeHtml(aiConfig.model)}" required></label>
        <label>超时秒数<input name="timeoutSeconds" type="number" min="10" max="600" value="${escapeHtml(aiConfig.timeoutSeconds)}"></label>
        <label>分析上限<input name="analysisLimit" type="number" min="1" max="500" value="${escapeHtml(aiConfig.analysisLimit)}"></label>
        <button type="submit">保存 AI 接口配置</button>
        <button type="submit" class="secondary" formaction="/ai-config/test">测试连接</button>
      </form>
      <p class="muted-line">当前 Key：${aiConfig.hasApiKey ? escapeHtml(aiConfig.apiKeyMask) : '未配置'}</p>
    </section>`;
}

function auditLabel(audit) {
  if (!audit) return { className: 'doc-status unknown', text: '未体检' };
  if (audit.status === 'ok') return { className: 'doc-status ok', text: '完整' };
  if (audit.status === 'risk') return { className: 'doc-status risk', text: `风险 ${audit.risks.length} 项` };
  return { className: 'doc-status missing', text: `缺少 ${audit.missingRequired.length} 项` };
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

function renderDocsPanel(documentation = { projects: [] }, selectedDocument = null) {
  const projects = documentation.projects || [];
  const categories = [...new Set(projects.flatMap((project) => project.documents.map((doc) => doc.category)))].sort();
  const categoryOptions = categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
  const selectedProjectId = selectedDocument?.project?.id || projects[0]?.id || '';
  const quickLinks = [
    ['项目总览', 'portal', 'docs/BRIANHUB_PROJECTS.md'],
    ['新项目接入', 'portal', 'docs/NEW_PROJECT_ONBOARDING_PROMPT.md'],
    ['通用开发规则', 'portal', 'docs/BRIANHUB_DEVELOPMENT_STANDARD.md'],
    ['网关/SSO/AI', 'portal', 'docs/BRIANHUB_GATEWAY_AND_SSO.md'],
    ['文档审计', 'portal', 'docs/NEW_PROJECT_DOCUMENTATION_REQUIREMENTS.md']
  ].map(([label, projectId, docPath]) => `
        <a href="/?tab=docs&project=${encodeURIComponent(projectId)}&doc=${encodeURIComponent(docPath)}">${escapeHtml(label)}</a>`).join('');

  const projectBlocks = projects.map((project) => {
    const audit = auditLabel(project.audit);
    const coreDocs = project.documents.filter((doc) => CORE_DOC_PATHS.has(doc.path));
    const extraDocs = project.documents.filter((doc) => !CORE_DOC_PATHS.has(doc.path));
    const coreLinks = coreDocs.length
      ? coreDocs.map((doc) => renderDocLink(project, doc)).join('')
      : '<p class="muted-line">暂无核心文档。</p>';
    const extraLinks = extraDocs.length
      ? extraDocs.map((doc) => renderDocLink(project, doc)).join('')
      : '<p class="muted-line">暂无更多文档。</p>';
    const openAttr = project.id === selectedProjectId ? ' open' : '';
    return `
      <details class="doc-project"${openAttr}>
        <summary class="doc-project-toggle">
          <span>
            <strong>${escapeHtml(project.name)}</strong>
            <small>文档 ${project.documents.length} 份</small>
          </span>
          <span class="${audit.className}">${audit.text}</span>
        </summary>
        <div class="doc-project-body">
          <div class="doc-section-label">核心文档</div>
          <div class="doc-list doc-core-list">${coreLinks}</div>
          <details class="doc-more-docs"${extraDocs.length ? '' : ' open'}>
            <summary>更多文档 ${extraDocs.length} 份</summary>
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
      <h2>选择一份文档</h2>
      <p class="muted-line">从左侧项目列表打开 README、PRD、部署说明、变更记录或专题文档。</p>
    </aside>`;

  return `
    <section class="panel docs-panel">
      <div class="section-head">
        <h2>文档中心</h2>
        <p>先看常用入口和核心文档；专题资料按项目折叠收纳，需要时再展开。</p>
      </div>
      <nav class="doc-quick-links" aria-label="文档快速入口">${quickLinks}</nav>
      <div class="doc-tools">
        <label class="doc-search">搜索文档<input type="search" id="doc-search" placeholder="输入项目、标题、路径或分类"></label>
        <label class="doc-filter">文档分类<select id="doc-category"><option value="">全部分类</option>${categoryOptions}</select></label>
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

function renderPortalPage({ projects, projectHealth = [], user, activeTab = 'projects', users = [], userProjects = [], aiConfig, documentation, selectedDocument, message = '', error = '' }) {
  const tab = ['projects', 'users', 'ai', 'docs'].includes(activeTab) ? activeTab : 'projects';
  const body = tab === 'users'
    ? renderUsersPanel(users, userProjects)
    : tab === 'ai'
      ? renderAiPanel(aiConfig)
      : tab === 'docs'
        ? renderDocsPanel(documentation, selectedDocument)
        : renderProjectGrid(projects, projectHealth);
  const roleLabel = user.role === 'admin' ? '管理员' : '普通用户';

  return layout('BrianHub 门户', `
    <main class="portal-shell">
      <header class="portal-header">
        <div>
          <p class="eyebrow">BrianHub</p>
          <h1>项目导航</h1>
          <p class="muted-line">${escapeHtml(user.username)} · ${roleLabel}</p>
        </div>
        <form method="post" action="/logout"><button type="submit" class="secondary">退出登录</button></form>
      </header>
      <nav class="portal-tabs">
        <a class="${tab === 'projects' ? 'active' : ''}" href="/">项目导航</a>
        ${user.role === 'admin' ? `<a class="${tab === 'users' ? 'active' : ''}" href="/?tab=users">用户管理</a>` : ''}
        ${user.role === 'admin' ? `<a class="${tab === 'ai' ? 'active' : ''}" href="/?tab=ai">AI 接口</a>` : ''}
        ${user.role === 'admin' ? `<a class="${tab === 'docs' ? 'active' : ''}" href="/?tab=docs">文档中心</a>` : ''}
      </nav>
      ${renderNotice({ message, error })}
      ${body}
    </main>`);
}

module.exports = { escapeHtml, renderLoginPage, renderPortalPage, renderMarkdown };
