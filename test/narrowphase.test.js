import { test } from 'node:test';
import assert from 'node:assert/strict';
import { circleVsCircle } from '../src/physics/narrowphase.js';

const circle = (x, y, radius) => ({ x, y, radius });

test('overlapping circles report correct penetration depth', () => {
  const hit = circleVsCircle(circle(0, 0, 5), circle(8, 0, 5));
  // radiusSum 10, dist 8, depth 2
  assert.ok(Math.abs(hit.depth - 2) < 1e-9);
});

test('circle normal points from a toward b', () => {
  const hit = circleVsCircle(circle(0, 0, 5), circle(8, 0, 5));
  assert.ok(hit.normal.x > 0);
});

test('non-overlapping circles return null', () => {
  assert.equal(circleVsCircle(circle(0, 0, 1), circle(10, 0, 1)), null);
});

test('circles exactly touching return null (not overlapping)', () => {
  assert.equal(circleVsCircle(circle(0, 0, 5), circle(10, 0, 5)), null);
});

test('coincident circles pick an arbitrary but consistent normal instead of NaN', () => {
  const hit = circleVsCircle(circle(5, 5, 2), circle(5, 5, 2));
  assert.deepEqual(hit.normal, { x: 1, y: 0 });
});
