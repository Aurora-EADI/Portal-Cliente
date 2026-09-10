const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const axios = require('axios');

// Run the real services/interceptors with an isolated browser cookie jar and HTTP adapter.
function session(adapter, jar = new Map()) {
  const browserAdapter = config => {
    if (config.withCredentials) config.headers.Cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    return adapter(config);
  };
  const http = axios.create({ adapter: browserAdapter });
  http.create = (config) => axios.create({ ...config, adapter: browserAdapter });
  const location = { pathname: '/dashboard', href: '/dashboard' };
  const cache = new Map();
  function load(name) {
    if (cache.has(name)) return cache.get(name);
    const filename = path.join(__dirname, '../src', name + '.ts');
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(source, {
      module, exports: module.exports,
      process: { env: { NEXT_PUBLIC_API_URL: 'http://localhost:3030/api' } },
      window: { location },
      require(id) {
        if (id === 'axios') return http;
        if (id === 'js-cookie') return {
          get: (key) => jar.get(key), set: (key, value) => jar.set(key, value),
          remove: (key) => jar.delete(key),
        };
        if (id.startsWith('@/')) return load(id.slice(2));
        if (id.startsWith('./')) return load(path.posix.join(path.posix.dirname(name), id));
        throw new Error(`Unexpected dependency: ${id}`);
      },
    }, { filename });
    cache.set(name, module.exports);
    return module.exports;
  }
  return { auth: load('services/api').authService, api: load('lib/api').api, jar, location };
}

function response(config, status, data) {
  const result = { config, status, data, headers: {}, statusText: String(status) };
  if (status >= 400) throw new axios.AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, result);
  return result;
}

test('login and page reload use the same API and preserve the session', async () => {
  const jar = new Map();
  const adapter = async (config) => {
    const target = axios.getUri(config);
    if (target === 'http://localhost:3030/api/auth/login') {
      jar.set('access_token', 'valid'); jar.set('refresh_token', 'renew');
      return response(config, 200, { user: { id: 'user-1' }, expires_at: 'later' });
    }
    if (target === 'http://localhost:3030/api/auth/me' && config.headers.Cookie?.includes('access_token=valid')) {
      return response(config, 200, { user: { id: 'user-1' } });
    }
    return response(config, 401, { message: 'Wrong auth authority' });
  };
  await session(adapter, jar).auth.login('user@example.test', 'password');
  const reloaded = session(adapter, jar);
  assert.equal((await reloaded.auth.getProfile()).id, 'user-1');
  assert.equal(jar.get('refresh_token'), 'renew');
  assert.equal(reloaded.location.href, '/dashboard');
});

test('invalid login does not renew an existing session', async () => {
  let refreshes = 0;
  const client = session(async (config) => {
    if (config.url.endsWith('/auth/refresh')) refreshes++;
    return response(config, 401, { message: 'Invalid credentials' });
  }, new Map([['refresh_token', 'existing']]));
  await assert.rejects(client.auth.login('user@example.test', 'wrong'), /Invalid credentials/);
  assert.equal(refreshes, 0);
  assert.equal(client.location.href, '/dashboard');
});

test('temporary refresh failure preserves cookies and does not declare expiration', async () => {
  const client = session(async (config) => response(config,
    config.url.endsWith('/auth/refresh') ? 503 : 401, {}),
  new Map([['access_token', 'expired'], ['refresh_token', 'renew']]));
  await assert.rejects(client.auth.getProfile());
  assert.equal(client.jar.get('refresh_token'), 'renew');
  assert.equal(client.location.href, '/dashboard');
});

test('concurrent unauthorized requests renew once and retry successfully', async () => {
  let refreshes = 0;
  const client = session(async (config) => {
    if (config.url.endsWith('/auth/refresh')) {
      refreshes++;
      await new Promise(resolve => setTimeout(resolve, 10));
      client.jar.set('access_token', 'new'); client.jar.set('refresh_token', 'new-refresh');
      return response(config, 200, { expires_at: 'later' });
    }
    return response(config, config.headers.Cookie?.includes('access_token=new') ? 200 : 401, { user: { id: 'user-1' } });
  }, new Map([['access_token', 'old'], ['refresh_token', 'renew']]));
  const users = await Promise.all([client.auth.getProfile(), client.auth.getProfile()]);
  assert.equal(users.length, 2);
  assert.equal(refreshes, 1);
  assert.equal(client.jar.get('refresh_token'), 'new-refresh');
});

test('profile can renew when only the refresh cookie remains', async () => {
  const client = session(async (config) => {
    if (config.url === '/auth/refresh') {
      client.jar.set('access_token', 'new'); client.jar.set('refresh_token', 'rotated');
      return response(config, 200, { expires_at: 'later' });
    }
    return response(config, config.headers.Cookie?.includes('access_token=new') ? 200 : 401, { user: { id: 'user-1' } });
  }, new Map([['refresh_token', 'renew']]));
  assert.equal((await client.auth.getProfile()).id, 'user-1');
  assert.equal(client.jar.get('access_token'), 'new');
});

test('rejected refresh redirects without manipulating httpOnly credentials', async () => {
  const client = session(async (config) => response(config, 401, {}),
    new Map([['access_token', 'old'], ['refresh_token', 'revoked']]));
  await assert.rejects(client.auth.getProfile());
  assert.equal(client.jar.get('refresh_token'), 'revoked'); // JS cannot clear httpOnly cookies.
  assert.equal(client.location.href, '/session-expired');
});

test('retried concurrent requests cannot start another renewal loop', async () => {
  let refreshes = 0;
  const client = session(async (config) => {
    if (config.url === '/auth/refresh') {
      refreshes++;
      await new Promise(resolve => setTimeout(resolve, 10));
      return response(config, 200, { token: 'still-invalid', refreshToken: 'rotated' });
    }
    return response(config, 401, {});
  }, new Map([['access_token', 'old'], ['refresh_token', 'renew']]));
  const results = await Promise.allSettled([client.auth.getProfile(), client.auth.getProfile()]);
  assert.ok(results.every(result => result.status === 'rejected'));
  assert.equal(refreshes, 1);
});


test('anonymous session probe stays on the current page', async () => {
  const client = session(async config => response(config, 401, {}));
  assert.equal(await client.auth.restoreSession(), null);
  assert.equal(client.location.href, '/dashboard');
});

test('logout calls the configured auth server with credentials', async () => {
  let request;
  const client = session(async config => { request = config; return response(config, 200, { ok: true }); });
  await client.auth.logout();
  assert.equal(request.url, '/auth/logout');
  assert.equal(request.withCredentials, true);
});
