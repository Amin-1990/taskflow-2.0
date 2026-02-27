#!/usr/bin/env node
/* eslint-disable no-console */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000/api';
const READONLY_TOKEN = process.env.SMOKE_READONLY_TOKEN || '';
const READONLY_USERNAME = process.env.SMOKE_READONLY_USERNAME || '';
const READONLY_PASSWORD = process.env.SMOKE_READONLY_PASSWORD || '';

const MODULES = [
  { name: 'COMMANDES', getPath: '/commandes', postPath: '/commandes' },
  { name: 'PLANNING', getPath: '/planning', postPath: '/planning' },
  { name: 'PERSONNEL', getPath: '/personnel', postPath: '/personnel' }
];

async function request(path, { method = 'GET', token = '', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    // ignore non json
  }

  return { status: response.status, data };
}

async function loginReadonlyToken() {
  if (READONLY_TOKEN) return READONLY_TOKEN;
  if (!READONLY_USERNAME || !READONLY_PASSWORD) {
    throw new Error(
      'Missing readonly credentials. Provide SMOKE_READONLY_TOKEN or SMOKE_READONLY_USERNAME/SMOKE_READONLY_PASSWORD.'
    );
  }

  const res = await request('/auth/login', {
    method: 'POST',
    body: { username: READONLY_USERNAME, password: READONLY_PASSWORD }
  });

  const token = res?.data?.data?.accessToken || res?.data?.accessToken || '';
  if (res.status !== 200 || !token) {
    throw new Error(`Readonly login failed (status ${res.status}).`);
  }
  return token;
}

function expectStatus(moduleName, scenario, received, expected) {
  const ok = received === expected;
  const mark = ok ? 'OK' : 'FAIL';
  console.log(`${mark} | ${moduleName} | ${scenario} | expected=${expected} got=${received}`);
  return ok;
}

async function run() {
  console.log(`RBAC smoke test - base URL: ${BASE_URL}`);
  const token = await loginReadonlyToken();

  let hasFailure = false;

  for (const module of MODULES) {
    const getWithToken = await request(module.getPath, { method: 'GET', token });
    const postWithToken = await request(module.postPath, { method: 'POST', token, body: {} });
    const getWithoutToken = await request(module.getPath, { method: 'GET' });

    const ok1 = expectStatus(module.name, 'GET with LECTURE_SEULE token', getWithToken.status, 200);
    const ok2 = expectStatus(module.name, 'POST with LECTURE_SEULE token', postWithToken.status, 403);
    const ok3 = expectStatus(module.name, 'GET without token', getWithoutToken.status, 401);

    hasFailure = hasFailure || !ok1 || !ok2 || !ok3;
  }

  if (hasFailure) {
    console.error('\nRBAC smoke test failed.');
    process.exit(1);
  }

  console.log('\nRBAC smoke test passed for COMMANDES, PLANNING, PERSONNEL.');
}

run().catch((error) => {
  console.error(`Smoke test error: ${error.message}`);
  process.exit(1);
});

