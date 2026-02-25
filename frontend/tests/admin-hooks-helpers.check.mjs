import assert from 'node:assert/strict';
import { parseCsvIds, sanitizeAdminQueryParams, isValidResetPassword } from '../src/pages/admin/hooks/adminHooks.helpers.ts';

const params = sanitizeAdminQueryParams({
  page: 1,
  limit: 25,
  search: '',
  status: 'active',
  from: undefined,
  to: null
});
assert.deepEqual(params, { page: 1, limit: 25, status: 'active' });

const ids = parseCsvIds('1, 2, x, -3, 4.5, 9');
assert.deepEqual(ids, [1, 2, 9]);

assert.equal(isValidResetPassword('1234567'), false);
assert.equal(isValidResetPassword('12345678'), true);
assert.equal(isValidResetPassword('abcDEF!2'), true);

console.log('admin-hooks-helpers checks passed');
