import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overlaps, union, fromCircle, fromPoints } from '../src/math/aabb.js';

const box = (minX, minY, maxX, maxY) => ({ minX, minY, maxX, maxY });

test('overlapping boxes return true', () => {
  assert.equal(overlaps(box(0, 0, 10, 10), box(5, 5, 15, 15)), true);
});

test('non-overlapping boxes return false', () => {
  assert.equal(overlaps(box(0, 0, 10, 10), box(20, 20, 30, 30)), false);
});

test('boxes touching exactly at an edge count as overlapping', () => {
  assert.equal(overlaps(box(0, 0, 10, 10), box(10, 0, 20, 10)), true);
});

test('boxes separated by a gap of 1 do not overlap', () => {
  assert.equal(overlaps(box(0, 0, 10, 10), box(11, 0, 20, 10)), false);
});

test('union produces the smallest box containing both', () => {
  assert.deepEqual(union(box(0, 0, 5, 5), box(3, 3, 10, 8)), box(0, 0, 10, 8));
});

test('fromCircle produces a box of the correct size', () => {
  assert.deepEqual(fromCircle({ x: 10, y: 10 }, 3), box(7, 7, 13, 13));
});

test('fromPoints bounds a set of points', () => {
  const points = [{ x: 1, y: 5 }, { x: -2, y: 3 }, { x: 4, y: -1 }];
  assert.deepEqual(fromPoints(points), box(-2, -1, 4, 5));
});
