import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { buildApp } from '../server/app.js';

async function withApp(run) {
  const app = buildApp({ logger: false });
  try {
    return await run(app);
  } finally {
    await app.close();
  }
}

function jsonBody(response) {
  return JSON.parse(response.body);
}

test('GET /api/health returns the stable health response', async () => {
  await withApp(async (app) => {
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(jsonBody(response), { status: 'ok' });
  });
});

test('API responses include the public CORS header', async () => {
  await withApp(async (app) => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
      headers: { origin: 'https://example.test' }
    });

    assert.equal(response.headers['access-control-allow-origin'], '*');
  });
});

test('frontend entrypoint and built assets are served', async () => {
  await withApp(async (app) => {
    const root = await app.inject({ method: 'GET', url: '/' });
    const page = await app.inject({ method: 'GET', url: '/auth.html' });
    const bundle = await app.inject({ method: 'GET', url: '/js/bundle.js' });
    const styles = await app.inject({ method: 'GET', url: '/css/output.css' });

    assert.equal(root.statusCode, 200);
    assert.match(root.headers['content-type'], /^text\/html/);
    assert.match(root.body, /<!DOCTYPE html>/i);
    assert.equal(page.statusCode, 200);
    assert.equal(bundle.statusCode, 200);
    assert.match(bundle.headers['content-type'], /javascript/);
    assert.equal(styles.statusCode, 200);
    assert.match(styles.headers['content-type'], /^text\/css/);
  });
});

test('static serving blocks sensitive files and traversal attempts', async () => {
  await withApp(async (app) => {
    const blockedPaths = [
      '/.env',
      '/.git/HEAD',
      '/package.json',
      '/tests/e2e.test.mjs',
      '/js/main.js',
      '/%2e%2e/package.json',
      '/..%2Fpackage.json',
      '/../package.json'
    ];

    for (const url of blockedPaths) {
      const response = await app.inject({ method: 'GET', url });
      assert.equal(response.statusCode, 404, `${url} must be blocked`);
    }
  });
});

test('unknown API routes return a stable JSON 404 without framework details', async () => {
  await withApp(async (app) => {
    const response = await app.inject({ method: 'GET', url: '/api/missing' });
    const body = jsonBody(response);

    assert.equal(response.statusCode, 404);
    assert.deepEqual(body, {
      error: { code: 'NOT_FOUND', message: 'Route not found' }
    });
    assert.doesNotMatch(response.body, /stack|fastify/i);
  });
});

test('API failures hide internal error details', async () => {
  await withApp(async (app) => {
    app.get('/api/test-error', async () => {
      throw new Error('secret internal failure');
    });

    const response = await app.inject({ method: 'GET', url: '/api/test-error' });
    const body = jsonBody(response);

    assert.equal(response.statusCode, 500);
    assert.deepEqual(body, {
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' }
    });
    assert.doesNotMatch(response.body, /secret internal failure|stack/i);
  });
});

async function waitForListening(child) {
  return new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error(`server did not start: ${output}`)), 5000);
    const onData = (chunk) => {
      output += chunk.toString();
      if (/listening/i.test(output)) {
        clearTimeout(timeout);
        resolve();
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('exit', (code, signal) => {
      if (code !== null || signal !== null) {
        clearTimeout(timeout);
        reject(new Error(`server exited before listening: ${code ?? signal}`));
      }
    });
  });
}

test('server exits cleanly after SIGTERM', async (t) => {
  const child = spawn(process.execPath, ['server/server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, HOST: '127.0.0.1', PORT: '0' }
  });

  t.after(() => {
    if (child.exitCode === null) child.kill('SIGKILL');
  });

  await waitForListening(child);
  child.kill('SIGTERM');
  const [code, signal] = await once(child, 'exit');
  assert.equal(code, 0);
  assert.equal(signal, null);
});
