import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/ecs/world.js';
import { attachSystems } from '../src/ecs/system.js';
import { Position, Velocity, Mass } from '../src/ecs/components.js';

test('systems run in registration order', () => {
  const world = createWorld();
  const { registerSystem, tick } = attachSystems(world);
  const order = [];
  registerSystem(() => order.push('a'));
  registerSystem(() => order.push('b'));
  registerSystem(() => order.push('c'));
  tick(1 / 60);
  assert.deepEqual(order, ['a', 'b', 'c']);
});

test('tick passes dt through to each system', () => {
  const world = createWorld();
  const { registerSystem, tick } = attachSystems(world);
  let seen = null;
  registerSystem((w, dt) => { seen = dt; });
  tick(0.5);
  assert.equal(seen, 0.5);
});

test('query returns only entities with every requested component', () => {
  const world = createWorld();
  const { query } = attachSystems(world);
  const a = world.createEntity();
  const b = world.createEntity();
  const c = world.createEntity();
  world.addComponent(a, Position, Position());
  world.addComponent(a, Velocity, Velocity());
  world.addComponent(b, Position, Position());
  world.addComponent(c, Velocity, Velocity());

  assert.deepEqual(query(Position, Velocity), [a]);
  assert.deepEqual(query(Position).sort(), [a, b].sort());
});

test('query with no matches returns an empty array', () => {
  const world = createWorld();
  const { query } = attachSystems(world);
  world.createEntity();
  assert.deepEqual(query(Mass), []);
});

test('query ignores destroyed entities', () => {
  const world = createWorld();
  const { query } = attachSystems(world);
  const a = world.createEntity();
  world.addComponent(a, Position, Position());
  world.destroyEntity(a);
  assert.deepEqual(query(Position), []);
});
