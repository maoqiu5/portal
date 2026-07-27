const test = require('node:test');
const assert = require('node:assert/strict');
const { documentProjects } = require('../src/documentProjects');

test('document center includes Home Assistant project docs', () => {
  const project = documentProjects.find((item) => item.id === 'homeassistant');
  assert.ok(project);
  assert.equal(project.name, '\u667a\u80fd\u5bb6\u5c45\u63a7\u5236\u53f0');
  assert.match(project.root, /homeassistant$/);
});
