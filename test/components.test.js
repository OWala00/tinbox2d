import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/ecs/world.js';
import { Position, Velocity, Mass } from '../src/ecs/components.js';

test('addComponent then getComponent returns the same data', () => {
  const world = createWorld();
  const id = world.createEntity();
  const pos = Position(10, 20);
  world.addComponent(id, Position, pos);
  assert.equal(world.getComponent(id, Position), pos);
});

test('getComponent on a missing component returns undefined', () => {
  const world = createWorld();
  const id = world.createEntity();
  assert.equal(world.getComponent(id, Velocity), undefined);
});

test('removeComponent clears it', () => {
  const world = createWorld();
  const id = world.createEntity();
  world.addComponent(id, Mass, Mass(5));
  world.removeComponent(id, Mass);
  assert.equal(world.hasComponent(id, Mass), false);
});

test('hasComponent reflects current state', () => {
  const world = createWorld();
  const id = world.createEntity();
  assert.equal(world.hasComponent(id, Position), false);
  world.addComponent(id, Position, Position());
  assert.equal(world.hasComponent(id, Position), true);
});

test('destroying an entity clears all of its components', () => {
  const world = createWorld();
  const id = world.createEntity();
  world.addComponent(id, Position, Position());
  world.addComponent(id, Velocity, Velocity());
  world.destroyEntity(id);
  assert.equal(world.hasComponent(id, Position), false);
  assert.equal(world.hasComponent(id, Velocity), false);
});

test('components on one entity do not leak onto another', () => {
  const world = createWorld();
  const a = world.createEntity();
  const b = world.createEntity();
  world.addComponent(a, Position, Position(1, 1));
  assert.equal(world.hasComponent(b, Position), false);
});
