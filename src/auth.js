const crypto = require('node:crypto');

const PASSWORD_ITERATIONS = 120000;
const PASSWORD_KEYLEN = 32;
const PASSWORD_DIGEST = 'sha256';

function verifyPassword(inputPassword, expectedPassword) {
  if (!inputPassword || !expectedPassword) return false;
  const input = Buffer.from(inputPassword);
  const expected = Buffer.from(expectedPassword);
  if (input.length !== expected.length) return false;
  return crypto.timingSafeEqual(input, expected);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  if (!password) throw new Error('Password is required');
  const hash = crypto
    .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEYLEN, PASSWORD_DIGEST)
    .toString('hex');
  return `pbkdf2:${PASSWORD_DIGEST}:${PASSWORD_ITERATIONS}:${salt}:${hash}`;
}

function verifyPasswordHash(password, storedHash) {
  if (!password || !storedHash) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 5 || parts[0] !== 'pbkdf2' || parts[1] !== PASSWORD_DIGEST) return false;
  const iterations = Number(parts[2]);
  const salt = parts[3];
  const hash = parts[4];
  if (!Number.isInteger(iterations) || iterations <= 0 || !salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(password, salt, iterations, PASSWORD_KEYLEN, PASSWORD_DIGEST).toString('hex');
  const actual = Buffer.from(candidate);
  const expected = Buffer.from(hash);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function createSessionToken(secret, nowMs = Date.now(), claims = {}) {
  const payload = JSON.stringify({ ...claims, iat: nowMs });
  const encodedPayload = Buffer.from(payload).toString('base64url');
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token, secret, maxAgeMs, nowMs = Date.now()) {
  if (!token || !secret || !maxAgeMs) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [encodedPayload, signature] = parts;
  const expectedSignature = sign(encodedPayload, secret);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!Number.isFinite(payload.iat) || nowMs - payload.iat < 0 || nowMs - payload.iat > maxAgeMs) return false;
    return payload;
  } catch {
    return false;
  }
}

module.exports = { verifyPassword, hashPassword, verifyPasswordHash, createSessionToken, verifySessionToken };
