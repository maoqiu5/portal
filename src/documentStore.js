const fs = require('node:fs');
const path = require('node:path');

const EXCLUDED_PARTS = new Set([
  'node_modules',
  '.venv',
  '.git',
  'backups',
  'data',
  'runtime',
  '.pytest_cache',
  '.pnpm-store',
  'logs',
  'report-source',
  'secrets'
]);

const EXCLUDED_ROOT_FILES = new Set([
  'progress.md',
  'task_plan.md',
  'findings.md'
]);

const REQUIRED_DOCS = [
  'docs/README.md',
  'docs/PRD.md',
  'docs/DEPLOYMENT.md',
  'docs/CHANGELOG.md'
];

const SECRET_PATTERNS = [
  /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["']?[^"'\s]{8,}/i,
  /\bsk-[a-z0-9][a-z0-9_-]{12,}/i
];

function isMarkdown(filePath) {
  return filePath.toLowerCase().endsWith('.md');
}

function normalizeRelativePath(value) {
  const normalized = String(value || '').replaceAll('\\', '/');
  if (!normalized || normalized.startsWith('/') || normalized.includes('\0')) return null;
  const parts = normalized.split('/').filter(Boolean);
  if (parts.some((part) => part === '..' || part === '.')) return null;
  if (!isMarkdown(normalized)) return null;
  return parts.join('/');
}

function shouldSkip(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/');
  if (EXCLUDED_ROOT_FILES.has(normalized.toLowerCase())) return true;
  return normalized.split('/').some((part) => EXCLUDED_PARTS.has(part) || part.startsWith('._'));
}

function removeDuplicateDocuments(paths) {
  const pathSet = new Set(paths);
  return paths.filter((relativePath) => {
    const normalized = relativePath.toLowerCase();
    if (normalized === 'changelog.md' && pathSet.has('docs/CHANGELOG.md')) return false;
    return true;
  });
}

function titleFromContent(content, fallback) {
  const line = content.split(/\r?\n/).find((item) => /^#\s+/.test(item));
  return line ? line.replace(/^#\s+/, '').trim() : fallback.replace(/\.md$/i, '');
}

function categoryFor(relativePath) {
  const parts = relativePath.split('/');
  if (parts.length === 1) return '入口';
  const first = parts[0].toLowerCase();
  if (first === 'docs' && parts.length === 2) return '核心文档';
  if (first === 'docs') return parts[1];
  return first;
}

function documentSortKey(relativePath) {
  const priority = new Map([
    ['README.md', 0],
    ['docs/README.md', 1],
    ['docs/PRD.md', 2],
    ['docs/DEPLOYMENT.md', 3],
    ['docs/CHANGELOG.md', 4],
    ['docs/HANDOFF.md', 5]
  ]);
  return `${priority.get(relativePath) ?? 9}:${relativePath}`;
}

function walkMarkdown(root, current = root, output = []) {
  if (!fs.existsSync(current)) return output;
  const entries = fs.readdirSync(current, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(current, entry.name);
    const relativePath = path.relative(root, fullPath).replaceAll(path.sep, '/');
    if (shouldSkip(relativePath)) continue;
    if (entry.isDirectory()) {
      walkMarkdown(root, fullPath, output);
      continue;
    }
    if (entry.isFile() && isMarkdown(entry.name)) output.push(relativePath);
  }
  return output;
}

function hasSecretLikeValue(content) {
  return SECRET_PATTERNS.some((pattern) => pattern.test(content));
}

function createDocumentStore({ projects, cacheTtlMs = 60_000, now = () => Date.now() }) {
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  let cachedIndex = null;
  let cachedAudit = null;
  let cacheExpiresAt = 0;

  function readProjectDocuments(project) {
    return removeDuplicateDocuments(walkMarkdown(project.root))
      .map((relativePath) => {
        const fullPath = path.join(project.root, relativePath);
        const stat = fs.statSync(fullPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        return {
          path: relativePath,
          title: titleFromContent(content, path.basename(relativePath)),
          category: categoryFor(relativePath),
          updatedAt: stat.mtime.toISOString()
        };
      })
      .sort((a, b) => documentSortKey(a.path).localeCompare(documentSortKey(b.path)));
  }

  function buildIndex() {
    return {
      generatedAt: new Date(now()).toISOString(),
      projects: projects.map((project) => {
        const documents = readProjectDocuments(project);
        return { id: project.id, name: project.name, documents, audit: auditProject(project, documents) };
      })
    };
  }

  function getIndex() {
    const currentTime = now();
    if (cachedIndex && currentTime < cacheExpiresAt) return cachedIndex;
    cachedIndex = buildIndex();
    cachedAudit = {
      generatedAt: cachedIndex.generatedAt,
      projects: cachedIndex.projects.map((project) => project.audit)
    };
    cacheExpiresAt = currentTime + cacheTtlMs;
    return cachedIndex;
  }

  function auditProject(project, documents) {
    const paths = new Set(documents.map((doc) => doc.path));
    const missingRequired = REQUIRED_DOCS.filter((requiredPath) => !paths.has(requiredPath));
    const risks = [];

    for (const doc of documents) {
      const fullPath = path.join(project.root, doc.path);
      const content = fs.readFileSync(fullPath, 'utf8');
      if (hasSecretLikeValue(content)) risks.push({ type: '疑似密钥', path: doc.path });
    }

    const status = risks.length > 0 ? 'risk' : missingRequired.length > 0 ? 'missing' : 'ok';
    return {
      id: project.id,
      name: project.name,
      status,
      documentCount: documents.length,
      missingRequired,
      risks
    };
  }

  function listDocuments() {
    return getIndex();
  }

  function auditDocuments() {
    getIndex();
    return cachedAudit;
  }

  function getDocument(projectId, docPath) {
    const project = projectMap.get(projectId);
    const relativePath = normalizeRelativePath(docPath);
    if (!project || !relativePath || shouldSkip(relativePath)) return null;
    const fullPath = path.resolve(project.root, relativePath);
    const rootPath = path.resolve(project.root);
    if (!fullPath.startsWith(`${rootPath}${path.sep}`) && fullPath !== rootPath) return null;
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) return null;
    const content = fs.readFileSync(fullPath, 'utf8');
    return {
      project: { id: project.id, name: project.name },
      document: {
        path: relativePath,
        title: titleFromContent(content, path.basename(relativePath)),
        category: categoryFor(relativePath)
      },
      content
    };
  }

  return { listDocuments, auditDocuments, getDocument };
}

module.exports = { createDocumentStore, normalizeRelativePath };
