import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePosition, resolveVelocity } from '../src/physics/resolver.js';

const body = (x, y, invMass) => ({ position: { x, y }, invMass });
const bodyWithVel = (vx, vy, invMass) => ({ velocity: { x: vx, y: vy }, invMass });

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

test('perfectly elastic head-on collision of equal masses swaps velocities', () => {
  const a = bodyWithVel(5, 0, 1);
  const b = bodyWithVel(-5, 0, 1);
  resolveVelocity(a, b, { normal: { x: 1, y: 0 } }, 1);
  assert.ok(Math.abs(a.velocity.x - -5) < 1e-9);
  assert.ok(Math.abs(b.velocity.x - 5) < 1e-9);
});

test('perfectly inelastic collision leaves both bodies at the same normal velocity', () => {
  const a = bodyWithVel(5, 0, 1);
  const b = bodyWithVel(-5, 0, 1);
  resolveVelocity(a, b, { normal: { x: 1, y: 0 } }, 0);
  assert.ok(Math.abs(a.velocity.x - b.velocity.x) < 1e-9);
});

test('momentum is conserved before and after the collision', () => {
  const a = bodyWithVel(5, 0, 1); // mass 1
  const b = bodyWithVel(-2, 0, 0.5); // mass 2
  const massA = 1 / a.invMass;
  const massB = 1 / b.invMass;
  const before = massA * a.velocity.x + massB * b.velocity.x;

  resolveVelocity(a, b, { normal: { x: 1, y: 0 } }, 0.7);

  const after = massA * a.velocity.x + massB * b.velocity.x;
  assert.ok(Math.abs(before - after) < 1e-9);
});

test('a static body absorbs no velocity change from the impulse', () => {
  const a = bodyWithVel(0, 0, 0); // static
  const b = bodyWithVel(-5, 0, 1);
  resolveVelocity(a, b, { normal: { x: 1, y: 0 } }, 1);
  assert.deepEqual(a.velocity, { x: 0, y: 0 });
});

test('bodies already separating receive no impulse', () => {
  const a = bodyWithVel(-5, 0, 1);
  const b = bodyWithVel(5, 0, 1);
  resolveVelocity(a, b, { normal: { x: 1, y: 0 } }, 1);
  assert.deepEqual(a.velocity, { x: -5, y: 0 });
  assert.deepEqual(b.velocity, { x: 5, y: 0 });
});
