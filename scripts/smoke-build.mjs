// Comprueba el arranque del JavaScript compilado; solo permite conexiones a schemas de prueba.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { createServer } from 'node:net';
import { once } from 'node:events';

for (const [variable, schema] of [
  ['AUTH_TEST_DATABASE_URL', 'auth_test'],
  ['SIAGIE_TEST_DATABASE_URL', 'siagie_test'],
  ['ALERTA_TEST_DATABASE_URL', 'alerta_test'],
  ['SIMON_TEST_DATABASE_URL', 'simon_test'],
]) {
  assert.equal(
    new URL(process.env[variable]).searchParams.get('schema'),
    schema,
    `${variable} debe apuntar a ${schema}`,
  );
}

async function unusedPort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

for (const service of ['ms-auth', 'ms-siagie', 'ms-alerta', 'ms-simon']) {
  const port = await unusedPort();
  const child = spawn(process.execPath, [`dist/apps/${service}/main.js`], {
    env: {
      ...process.env,
      PORT: String(port),
      AUTH_DATABASE_URL: process.env.AUTH_TEST_DATABASE_URL,
      SIAGIE_DATABASE_URL: process.env.SIAGIE_TEST_DATABASE_URL,
      ALERTA_DATABASE_URL: process.env.ALERTA_TEST_DATABASE_URL,
      SIMON_DATABASE_URL: process.env.SIMON_TEST_DATABASE_URL,
      BACKGROUND_JOBS_ENABLED: 'false',
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  // No se imprimen logs del servidor: podrían contener detalles de conexión.
  child.stderr.resume();
  let spawnError;
  child.on('error', (error) => {
    spawnError = error;
  });
  try {
    let healthy = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (spawnError) throw spawnError;
      assert.equal(
        child.exitCode,
        null,
        `${service}: terminó antes de responder /health`,
      );
      try {
        const response = await fetch(`http://127.0.0.1:${port}/health`, {
          signal: AbortSignal.timeout(1000),
        });
        if (response.ok) {
          assert.deepEqual(await response.json(), { status: 'ok', service });
          healthy = true;
          break;
        }
      } catch (error) {
        if (error.code === 'ERR_ASSERTION') throw error;
      }
      await setTimeout(200);
    }
    assert.ok(healthy, `${service}: /health no respondió a tiempo`);
    console.log(`${service}: build inicia y /health responde correctamente`);
  } finally {
    if (child.exitCode === null && child.signalCode === null && child.pid) {
      const exited = once(child, 'exit');
      child.kill('SIGTERM');
      const timer = globalThis.setTimeout(() => child.kill('SIGKILL'), 3000);
      await exited;
      clearTimeout(timer);
    }
  }
}
