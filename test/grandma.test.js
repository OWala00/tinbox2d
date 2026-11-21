import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchRoute } from '../grandma/routes/router.js';

test('the base path and its trailing slash both match home', () => {
  assert.deepEqual(matchRoute('/grandma/routes'), { name: 'home' });
  assert.deepEqual(matchRoute('/grandma/routes/'), { name: 'home' });
});

test('a known room matches with or without a trailing slash', () => {
  assert.deepEqual(matchRoute('/grandma/routes/kitchen'), { name: 'room', slug: 'kitchen' });
  assert.deepEqual(matchRoute('/grandma/routes/porch/'), { name: 'room', slug: 'porch' });
});

test('an unknown room is missing, including prototype keys', () => {
  assert.deepEqual(matchRoute('/grandma/routes/attic'), { name: 'missing' });
  assert.deepEqual(matchRoute('/grandma/routes/constructor'), { name: 'missing' });
});
