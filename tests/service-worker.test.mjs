import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function createWorker({ offline = false } = {}) {
  const listeners = new Map();
  const entries = new Map();
  const writes = [];
  const deleted = [];
  const cache = {
    async match(request) { return entries.get(typeof request === 'string' ? request : new URL(request.url).pathname); },
    async put(request, response) {
      const key = new URL(request.url).pathname;
      writes.push(key);
      entries.set(key, response);
    },
    async addAll(paths) { paths.forEach((path) => entries.set(path, { offlineShell: path })); }
  };
  let networkCalls = 0;
  const worker = {
    self: {
      location: { origin: 'https://carlog.example' },
      addEventListener(name, callback) { listeners.set(name, callback); },
      skipWaiting() {},
      clients: { claim() {} }
    },
    caches: {
      async open() { return cache; },
      async match(path) { return cache.match(path); },
      async keys() { return ['xelog-static-v1', 'carlog-static-v1']; },
      async delete(key) { deleted.push(key); return true; }
    },
    fetch: async () => {
      networkCalls++;
      if (offline) throw new Error('offline');
      return { ok: true, type: 'basic', clone() { return this; } };
    },
    URL,
    Response: { error() { return { failed: true }; } }
  };
  runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), worker);
  return {
    listeners, writes, deleted,
    get networkCalls() { return networkCalls; },
    async fetch(path, { mode = 'cors', method = 'GET', origin = 'https://carlog.example' } = {}) {
      let response;
      const event = {
        request: { url: `${origin}${path}`, mode, method },
        respondWith(value) { response = value; }
      };
      listeners.get('fetch')(event);
      return response ? await response : null;
    },
    async install() {
      let finished;
      listeners.get('install')({ waitUntil(value) { finished = value; } });
      await finished;
    },
    async activate() {
      let finished;
      listeners.get('activate')({ waitUntil(value) { finished = value; } });
      await finished;
    }
  };
}

test('service worker never intercepts or caches authenticated API, POST, or external URLs', async () => {
  const worker = createWorker();
  await worker.install();
  assert.equal(await worker.fetch('/api/expenses?vehicleId=private'), null);
  assert.equal(await worker.fetch('/api/expenses', { method: 'POST' }), null);
  assert.equal(await worker.fetch('/_next/static/chunk.js', { origin: 'https://another.example' }), null);
  assert.equal(worker.networkCalls, 0);
  assert.deepEqual(worker.writes, []);
});

test('activation removes old XeLog and CarLog caches after a branding update', async () => {
  const worker = createWorker();
  await worker.activate();
  assert.deepEqual(worker.deleted, ['xelog-static-v1', 'carlog-static-v1']);
});

test('private navigation is network-only; disconnected navigation shows offline shell', async () => {
  const online = createWorker();
  await online.install();
  assert.equal((await online.fetch('/dashboard?org=private', { mode: 'navigate' })).ok, true);
  assert.deepEqual(online.writes, []);

  const offline = createWorker({ offline: true });
  await offline.install();
  assert.equal((await offline.fetch('/expenses/new', { mode: 'navigate' })).offlineShell, '/offline.html');
  assert.deepEqual(offline.writes, []);
});

test('only static versioned assets are cached and reused', async () => {
  const worker = createWorker();
  await worker.install();
  await worker.fetch('/_next/static/chunks/app-123.js');
  await worker.fetch('/_next/static/chunks/app-123.js');
  assert.equal(worker.networkCalls, 1);
  assert.deepEqual(worker.writes, ['/_next/static/chunks/app-123.js']);
});
