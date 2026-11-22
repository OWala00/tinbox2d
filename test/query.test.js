import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/ecs/world.js';
import { Position, Shape, Mass } from '../src/ecs/components.js';
import { bodyAt } from '../src/physics/query.js';

function add(world, x, y, shape, mass = 1) {
  const id = world.createEntity();
  world.addComponent(id, Position, Position(x, y));
  world.addComponent(id, Shape, shape);
  world.addComponent(id, Mass, Mass(mass));
  return id;
}

test('a point inside a circle hits it', () => {
  const world = createWorld();
  const id = add(world, 0, 0, { kind: 'circle', radius: 10 });
  assert.equal(bodyAt(world, { x: 6, y: 6 }), id);
});

test('a point just outside a circle misses it', () => {
  const world = createWorld();
  add(world, 0, 0, { kind: 'circle', radius: 10 });
  assert.equal(bodyAt(world, { x: 8, y: 8 }), null);
});

test('a point inside a box hits it, including near the corner', () => {
  const world = createWorld();
  const id = add(world, 50, 50, { kind: 'box', width: 20, height: 10 });
  assert.equal(bodyAt(world, { x: 59, y: 54 }), id);
  assert.equal(bodyAt(world, { x: 61, y: 50 }), null);
});

test('static bodies are skipped by default and found when asked', () => {
  const world = createWorld();
  const wall = add(world, 0, 0, { kind: 'box', width: 100, height: 100 }, 0);
  assert.equal(bodyAt(world, { x: 0, y: 0 }), null);
  assert.equal(bodyAt(world, { x: 0, y: 0 }, { dynamicOnly: false }), wall);
});

test('overlapping bodies resolve to the one created last', () => {
  const world = createWorld();
  add(world, 0, 0, { kind: 'circle', radius: 20 });
  const top = add(world, 5, 0, { kind: 'circle', radius: 20 });
  assert.equal(bodyAt(world, { x: 2, y: 0 }), top);
});
