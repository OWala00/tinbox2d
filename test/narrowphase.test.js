import { test } from 'node:test';
import assert from 'node:assert/strict';
import { circleVsCircle, aabbVsAabb, aabbVsCircle } from '../src/physics/narrowphase.js';

const circle = (x, y, radius) => ({ x, y, radius });
const box = (minX, minY, maxX, maxY) => ({ minX, minY, maxX, maxY });

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

test('boxes overlapping only on the x-axis resolve along x', () => {
  const hit = aabbVsAabb(box(0, 0, 10, 10), box(8, 0, 18, 10));
  assert.deepEqual(hit.normal, { x: 1, y: 0 });
  assert.ok(Math.abs(hit.depth - 2) < 1e-9);
});

test('boxes overlapping only on the y-axis resolve along y', () => {
  const hit = aabbVsAabb(box(0, 0, 10, 10), box(0, 8, 10, 18));
  assert.deepEqual(hit.normal, { x: 0, y: 1 });
  assert.ok(Math.abs(hit.depth - 2) < 1e-9);
});

test('deep box penetration still resolves along the shallower axis', () => {
  const hit = aabbVsAabb(box(0, 0, 10, 10), box(1, 9, 11, 19));
  // x overlap = 9, y overlap = 1, should resolve along y
  assert.deepEqual(hit.normal, { x: 0, y: 1 });
});

test('non-overlapping boxes return null', () => {
  assert.equal(aabbVsAabb(box(0, 0, 10, 10), box(20, 20, 30, 30)), null);
});

test('circle resting against a box face reports the face normal', () => {
  const hit = aabbVsCircle(box(0, 0, 10, 10), circle(5, -2, 3));
  assert.deepEqual(hit.normal, { x: 0, y: -1 });
});

test('circle overlapping a box corner reports the correct diagonal distance', () => {
  // box corner at (10,10), circle center just past it
  const hit = aabbVsCircle(box(0, 0, 10, 10), circle(12, 12, 4));
  const expectedDist = Math.sqrt(2 * 2 * 2);
  assert.ok(Math.abs(hit.depth - (4 - expectedDist)) < 1e-9);
});

test('circle center exactly inside the box resolves along least penetration', () => {
  const hit = aabbVsCircle(box(0, 0, 10, 2), circle(5, 1, 3));
  // box is wide and short: y overlap (to either edge) is smaller than x
  assert.deepEqual(hit.normal, { x: 0, y: 1 });
});

test('circle far from the box returns null', () => {
  assert.equal(aabbVsCircle(box(0, 0, 10, 10), circle(100, 100, 1)), null);
});
