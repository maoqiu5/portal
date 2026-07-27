const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createDocumentStore } = require('../src/documentStore');

function createProject(files = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-doc-store-'));
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  }
  return { id: 'demo', name: '演示项目', root };
}

test('document index hides process files and prefers docs changelog', () => {
  const project = createProject({
    'README.md': '# Project Home\n',
    'CHANGELOG.md': '# Root Changelog\n',
    'progress.md': '# Progress\n',
    'task_plan.md': '# Task Plan\n',
    'findings.md': '# Findings\n',
    'docs/CHANGELOG.md': '# Docs Changelog\n',
    'docs/PRD.md': '# Product Doc\n'
  });
  const store = createDocumentStore({ projects: [project] });
  const paths = store.listDocuments().projects[0].documents.map((doc) => doc.path);
  assert.deepEqual(paths, ['README.md', 'docs/PRD.md', 'docs/CHANGELOG.md']);
  assert.doesNotMatch(paths.join('\n'), /progress\.md/);
  assert.doesNotMatch(paths.join('\n'), /task_plan\.md/);
  assert.doesNotMatch(paths.join('\n'), /findings\.md/);
  assert.doesNotMatch(paths.join('\n'), /^CHANGELOG\.md$/m);
});

test('document audit reports missing required docs without leaking secret values', () => {
  const project = createProject({
    'docs/README.md': '# 文档入口\n',
    'docs/DEPLOYMENT.md': '# 部署说明\n\nOPENAI_API_KEY=sk-real-secret-value\n'
  });
  const store = createDocumentStore({ projects: [project] });

  const audit = store.auditDocuments().projects[0];

  assert.equal(audit.status, 'risk');
  assert.deepEqual(audit.missingRequired, ['docs/PRD.md', 'docs/CHANGELOG.md']);
  assert.deepEqual(audit.risks, [
    { type: '疑似密钥', path: 'docs/DEPLOYMENT.md' }
  ]);
  assert.doesNotMatch(JSON.stringify(audit), /sk-real-secret-value/);
});

test('document index uses cache until ttl expires', () => {
  const project = createProject({
    'README.md': '# 第一版\n'
  });
  let now = 1000;
  const store = createDocumentStore({
    projects: [project],
    cacheTtlMs: 60_000,
    now: () => now
  });

  assert.equal(store.listDocuments().projects[0].documents[0].title, '第一版');
  fs.writeFileSync(path.join(project.root, 'README.md'), '# 第二版\n');
  assert.equal(store.listDocuments().projects[0].documents[0].title, '第一版');

  now += 60_001;
  assert.equal(store.listDocuments().projects[0].documents[0].title, '第二版');
});
