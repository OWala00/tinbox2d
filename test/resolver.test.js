import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePosition } from '../src/physics/resolver.js';

const body = (x, y, invMass) => ({ position: { x, y }, invMass });

test('equal-mass overlapping bodies separate equally in opposite directions', () => {
  const a = body(0, 0, 1);
  const b = body(2, 0, 1);
  resolvePosition(a, b, { normal: { x: 1, y: 0 }, depth: 4 });
  // equal invMass splits the 4-unit depth evenly: each moves 2
  assert.ok(Math.abs(a.position.x - -2) < 1e-9);
  assert.ok(Math.abs(b.position.x - 4) < 1e-9);
});

test('a static body does not move, only the dynamic one does', () => {
  const a = body(0, 0, 0);
  const b = body(2, 0, 1);
  resolvePosition(a, b, { normal: { x: 1, y: 0 }, depth: 4 });
  assert.deepEqual(a.position, { x: 0, y: 0 });
  assert.ok(Math.abs(b.position.x - 6) < 1e-9);
});

test('two static bodies do nothing and do not throw', () => {
  const a = body(0, 0, 0);
  const b = body(2, 0, 0);
  assert.doesNotThrow(() => resolvePosition(a, b, { normal: { x: 1, y: 0 }, depth: 4 }));
  assert.deepEqual(a.position, { x: 0, y: 0 });
  assert.deepEqual(b.position, { x: 2, y: 0 });
});

test('the sum of both corrections matches the penetration depth', () => {
  const a = body(0, 0, 1);
  const b = body(2, 0, 1);
  resolvePosition(a, b, { normal: { x: 1, y: 0 }, depth: 4 });
  const totalMoved = (0 - a.position.x) + (b.position.x - 2);
  assert.ok(Math.abs(totalMoved - 4) < 1e-9);
});

test('heavier body (lower invMass) moves less than the lighter one', () => {
  const heavy = body(0, 0, 0.25);
  const light = body(2, 0, 1);
  resolvePosition(heavy, light, { normal: { x: 1, y: 0 }, depth: 5 });
  const heavyMoved = Math.abs(0 - heavy.position.x);
  const lightMoved = Math.abs(light.position.x - 2);
  assert.ok(heavyMoved < lightMoved);
});
