import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSpatialGrid } from '../src/physics/broadphase.js';

const box = (minX, minY, maxX, maxY) => ({ minX, minY, maxX, maxY });

test('two entities in the same cell are returned as a candidate pair', () => {
  const grid = createSpatialGrid(64);
  const pairs = grid.query([
    { id: 1, aabb: box(0, 0, 10, 10) },
    { id: 2, aabb: box(5, 5, 15, 15) },
  ]);
  assert.deepEqual(pairs, [[1, 2]]);
});

test('entities far apart in different cells are not returned', () => {
  const grid = createSpatialGrid(64);
  const pairs = grid.query([
    { id: 1, aabb: box(0, 0, 10, 10) },
    { id: 2, aabb: box(1000, 1000, 1010, 1010) },
  ]);
  assert.deepEqual(pairs, []);
});

test('an entity straddling a cell boundary is still found by its neighbor', () => {
  const grid = createSpatialGrid(10);
  // box spans from cell (-1,0) through (0,0): x from 5 to 15 crosses x=10 boundary
  const pairs = grid.query([
    { id: 1, aabb: box(5, 0, 15, 5) },
    { id: 2, aabb: box(12, 0, 20, 5) },
  ]);
  assert.deepEqual(pairs, [[1, 2]]);
});

test('no duplicate pairs even when entities share multiple cells', () => {
  const grid = createSpatialGrid(10);
  // both boxes span four cells each, heavily overlapping
  const pairs = grid.query([
    { id: 1, aabb: box(0, 0, 25, 25) },
    { id: 2, aabb: box(5, 5, 30, 30) },
  ]);
  assert.equal(pairs.length, 1);
});

test('a single entity produces no pairs', () => {
  const grid = createSpatialGrid(64);
  const pairs = grid.query([{ id: 1, aabb: box(0, 0, 10, 10) }]);
  assert.deepEqual(pairs, []);
});

test('three overlapping entities produce exactly three pairs', () => {
  const grid = createSpatialGrid(64);
  const pairs = grid.query([
    { id: 1, aabb: box(0, 0, 10, 10) },
    { id: 2, aabb: box(0, 0, 10, 10) },
    { id: 3, aabb: box(0, 0, 10, 10) },
  ]);
  assert.equal(pairs.length, 3);
});
