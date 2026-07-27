const test = require('node:test');
const assert = require('node:assert/strict');
const { projects } = require('../src/projects');

test('default project navigation includes LearnDesk', () => {
  const learndesk = projects.find((project) => project.id === 'learndesk');
  assert.ok(learndesk);
  assert.equal(learndesk.path, '/learndesk');
  assert.equal(learndesk.healthUrl, 'http://learndesk_app:3000/health');
});

test('default project navigation includes NAS management', () => {
  const nas = projects.find((project) => project.id === 'nas');
  assert.ok(nas);
  assert.equal(nas.path, '/nas');
  assert.equal(nas.healthUrl, 'http://172.19.0.1:13001/health');
});


test('default project navigation includes Home Assistant control panel', () => {
  const homeassistant = projects.find((project) => project.id === 'homeassistant');
  assert.ok(homeassistant);
  assert.equal(homeassistant.path, '/homeassistant');
  assert.equal(homeassistant.healthUrl, 'http://homeassistant_app:3000/health');
});
