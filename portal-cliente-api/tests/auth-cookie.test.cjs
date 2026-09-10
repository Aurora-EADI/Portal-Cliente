require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AuthController } = require('../src/auth/auth.controller');

function response() {
  const cookies = new Map();
  return {
    cookies,
    cookie(name, value, options) { cookies.set(name, { value, options }); },
    clearCookie(name, options) { cookies.set(name, { value: '', options }); },
  };
}

test('login returns user metadata and stores both tokens only in httpOnly cookies', async () => {
  const result = { user: { id: 'u1' }, token: 'access', refreshToken: 'refresh', expires_at: 'later' };
  const controller = new AuthController({ login: async () => result });
  const res = response();
  assert.deepEqual(await controller.login({ email: 'user@example.test', password: 'secret' }, res), {
    user: result.user, expires_at: 'later',
  });
  for (const name of ['access_token', 'refresh_token']) {
    assert.equal(res.cookies.get(name).options.httpOnly, true);
    assert.equal(res.cookies.get(name).options.sameSite, 'lax');
  }
});

test('refresh rotates cookies without exposing tokens in the response', async () => {
  const controller = new AuthController({ refresh: async token => {
    assert.equal(token, 'old');
    return { user: { id: 'u1' }, token: 'new-access', refreshToken: 'new-refresh', expires_at: 'later' };
  } });
  const res = response();
  const body = await controller.refresh({ cookies: { refresh_token: 'old' } }, res);
  assert.deepEqual(body, { user: { id: 'u1' }, expires_at: 'later' });
  assert.equal(res.cookies.get('refresh_token').value, 'new-refresh');
});

test('logout clears both cookies on the server', () => {
  const res = response();
  new AuthController({}).logout(res);
  assert.equal(res.cookies.get('access_token').value, '');
  assert.equal(res.cookies.get('refresh_token').value, '');
});
