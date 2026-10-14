import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add, sub, scale, dot, cross, length, normalize, perp, lerp } from '../src/math/vec2.js';

test('add combines components', () => {
  assert.deepEqual(add({ x: 1, y: 2 }, { x: 3, y: 4 }), { x: 4, y: 6 });
});

test('sub does not mutate inputs', () => {
  const a = { x: 5, y: 5 };
  const b = { x: 2, y: 1 };
  sub(a, b);
  assert.deepEqual(a, { x: 5, y: 5 });
  assert.deepEqual(b, { x: 2, y: 1 });
});

test('scale multiplies both components', () => {
  assert.deepEqual(scale({ x: 2, y: -3 }, 4), { x: 8, y: -12 });
});

test('dot matches hand-computed value', () => {
  assert.equal(dot({ x: 1, y: 2 }, { x: 3, y: 4 }), 11);
});

test('cross matches hand-computed value', () => {
  assert.equal(cross({ x: 1, y: 0 }, { x: 0, y: 1 }), 1);
});

test('length of a 3-4-5 vector is 5', () => {
  assert.equal(length({ x: 3, y: 4 }), 5);
});

test('normalize produces unit length', () => {
  const n = normalize({ x: 3, y: 4 });
  assert.ok(Math.abs(length(n) - 1) < 1e-9);
});

test('normalize of the zero vector does not NaN', () => {
  assert.deepEqual(normalize({ x: 0, y: 0 }), { x: 0, y: 0 });
});

test('perp rotates 90 degrees', () => {
  assert.deepEqual(perp({ x: 1, y: 1 }), { x: -1, y: 1 });
});

test('lerp at t=0 and t=1 returns the endpoints', () => {
  const a = { x: 0, y: 0 };
  const b = { x: 10, y: 10 };
  assert.deepEqual(lerp(a, b, 0), a);
  assert.deepEqual(lerp(a, b, 1), b);
});

test('lerp at t=0.5 returns the midpoint', () => {
  assert.deepEqual(lerp({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5), { x: 5, y: 10 });
});
