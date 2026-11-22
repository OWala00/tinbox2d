import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/ecs/world.js';
import { createConstraintSolver } from '../src/physics/constraints.js';
import { SCENES } from '../demo/scenes.js';

function build(key) {
  const world = createWorld();
  const solver = createConstraintSolver();
  SCENES[key].build(world, solver);
  let count = 0;
  for (const _ of world.entities()) count++;
  return { count, solver };
}

test('bouncing balls scene: 4 walls plus 20 balls', () => {
  assert.equal(build(1).count, 24);
});

test('box stack scene: 4 walls plus a 4-row pyramid of 10 boxes', () => {
  assert.equal(build(2).count, 14);
});

test('sandbox scene: 4 walls, 3 platforms, 10 loose bodies', () => {
  assert.equal(build(4).count, 17);
});

test('pendulum scene: one anchor, one bob, one distance constraint', () => {
  const { count, solver } = build(3);
  assert.equal(count, 2);
  assert.equal(solver.count(), 1);
});
