const test = require('node:test');
const assert = require('node:assert/strict');
const { projects } = require('../src/projects');
const { localizeProject } = require('../src/i18n');

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

test('default project navigation includes overseas rail cost module', () => {
  const railCost = projects.find((project) => project.id === 'rail-cost');
  assert.ok(railCost);
  assert.equal(railCost.name, '境外段铁路成本');
  assert.equal(railCost.path, '/rail-cost');
});

test('default project navigation replaces rates with factsheet entry', () => {
  const rates = projects.find((project) => project.id === 'rates');
  const factsheet = projects.find((project) => project.id === 'factsheet');
  assert.equal(rates, undefined);
  assert.ok(factsheet);
  assert.equal(factsheet.path, '/factsheet');
  assert.equal(factsheet.healthUrl, 'http://factsheet_app:3000/health');
});

test('factsheet has Chinese portal label and description', () => {
  const factsheet = projects.find((project) => project.id === 'factsheet');
  const localized = localizeProject(factsheet, 'zh-CN');
  assert.equal(localized.name, '中欧班列铁路运价');
  assert.equal(localized.description, '事实表项目入口。');
});
