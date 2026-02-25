import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsvIds, sanitizeAdminQueryParams, isValidResetPassword } from '../src/pages/admin/hooks/adminHooks.helpers.ts';

test('sanitizeAdminQueryParams removes empty and nullish values', () => {
  const params = sanitizeAdminQueryParams({
    page: 1,
    limit: 25,
    search: '',
    status: 'active',
    from: undefined,
    to: null
  });

  assert.deepEqual(params, {
    page: 1,
    limit: 25,
    status: 'active'
  });
});

test('parseCsvIds keeps only positive integers', () => {
  const ids = parseCsvIds('1, 2, x, -3, 4.5, 9');
  assert.deepEqual(ids, [1, 2, 9]);
});

test('isValidResetPassword enforces minimum length', () => {
  assert.equal(isValidResetPassword('1234567'), false);
  assert.equal(isValidResetPassword('12345678'), true);
  assert.equal(isValidResetPassword('abcDEF!2'), true);
});
