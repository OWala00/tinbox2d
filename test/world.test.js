import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/ecs/world.js';

test('creating entities gives unique ids', () => {
  const world = createWorld();
  const ids = new Set([world.createEntity(), world.createEntity(), world.createEntity()]);
  assert.equal(ids.size, 3);
});

test('destroying an entity marks it not alive', () => {
  const world = createWorld();
  const id = world.createEntity();
  world.destroyEntity(id);
  assert.equal(world.isAlive(id), false);
});

test('destroying and recreating reuses the freed id', () => {
  const world = createWorld();
  const a = world.createEntity();
  world.destroyEntity(a);
  const b = world.createEntity();
  assert.equal(b, a);
});

test('destroying an id twice does not break further allocation', () => {
  const world = createWorld();
  const a = world.createEntity();
  world.destroyEntity(a);
  world.destroyEntity(a);
  const b = world.createEntity();
  const c = world.createEntity();
  assert.notEqual(b, c);
});

test('a freshly created entity is alive', () => {
  const world = createWorld();
  const id = world.createEntity();
  assert.equal(world.isAlive(id), true);
});
