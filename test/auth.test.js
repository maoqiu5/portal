const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyPassword, hashPassword, verifyPasswordHash, createSessionToken, verifySessionToken } = require('../src/auth');

test('verifyPassword accepts the configured password only', () => {
  assert.equal(verifyPassword('secret', 'secret'), true);
  assert.equal(verifyPassword('wrong', 'secret'), false);
  assert.equal(verifyPassword('', 'secret'), false);
});

test('password hash verifies only the original password', () => {
  const hash = hashPassword('secret');
  assert.match(hash, /^pbkdf2:sha256:\d+:[a-f0-9]+:[a-f0-9]+$/);
  assert.equal(verifyPasswordHash('secret', hash), true);
  assert.equal(verifyPasswordHash('wrong', hash), false);
  assert.equal(verifyPasswordHash('secret', ''), false);
});

test('session token verifies with same secret and max age', () => {
  const token = createSessionToken('session-secret', 1000, { username: 'brian' });
  assert.deepEqual(verifySessionToken(token, 'session-secret', 60_000, 2000), { iat: 1000, username: 'brian' });
});

test('session token rejects wrong secret, tampering, and expiry', () => {
  const token = createSessionToken('session-secret', 1000);
  assert.equal(verifySessionToken(token, 'other-secret', 60_000, 2000), false);
  assert.equal(verifySessionToken(`${token}x`, 'session-secret', 60_000, 2000), false);
  assert.equal(verifySessionToken(token, 'session-secret', 60_000, 120_000), false);
});
