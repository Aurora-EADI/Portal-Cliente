const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function setup() {
  const sources = [], timers = new Map(), delays = [];
  let nextId = 0;
  class EventSource {
    constructor(url) { this.url = url; this.closed = false; sources.push(this); }
    close() { this.closed = true; }
  }
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '../src/lib/event-stream.ts'), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText, {
    module, exports: module.exports, EventSource,
    require: () => ({ get: () => 'test-token' }),
    setTimeout(fn, ms) { const id = ++nextId; timers.set(id, fn); delays.push(ms); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  return { ...module.exports, sources, timers, delays,
    tick() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); },
  };
}

test('persistent failure stops after five retries with increasing delays', () => {
  const env = setup();
  env.connectEventStream('/api/dis-averbadas/stream', () => {});
  for (let i = 0; i < 10; i++) {
    env.sources.at(-1).onerror?.();
    env.tick();
  }
  assert.equal(env.sources.length, 6);
  assert.deepEqual(env.delays, [5000, 10000, 20000, 40000, 60000]);
  assert.equal(env.timers.size, 0);
  assert.ok(env.sources.every(source => source.closed));
});

test('cleanup cancels pending reconnection and closes the connection', () => {
  const env = setup();
  const stop = env.connectEventStream('/api/agendamento/stream', () => {});
  env.sources[0].onerror();
  stop();
  env.tick();
  assert.equal(env.sources.length, 1);
  assert.equal(env.timers.size, 0);
  assert.equal(env.sources[0].closed, true);
});

test('valid events are delivered and reset consecutive retry delays', () => {
  const env = setup();
  const received = [];
  env.connectEventStream('/api/dis-averbadas/stream', data => received.push(data.id));
  env.sources[0].onerror();
  env.tick();
  env.sources[1].onmessage({ data: 'invalid' });
  env.sources[1].onmessage({ data: '{"id":"di-1"}' });
  env.sources[1].onerror();
  assert.deepEqual(received, ['di-1']);
  assert.deepEqual(env.delays, [5000, 5000]);
});
