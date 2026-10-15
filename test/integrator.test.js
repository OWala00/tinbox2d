import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/ecs/world.js';
import { createGravitySystem } from '../src/physics/integrator.js';
import { Position, Velocity, Mass } from '../src/ecs/components.js';

test('a free-falling body gains velocity matching g * dt', () => {
  const world = createWorld();
  const gravitySystem = createGravitySystem({ x: 0, y: 100 });
  const id = world.createEntity();
  world.addComponent(id, Position, Position(0, 0));
  world.addComponent(id, Velocity, Velocity(0, 0));

  gravitySystem(world, 0.1);

  const vel = world.getComponent(id, Velocity);
  assert.ok(Math.abs(vel.y - 10) < 1e-9);
});

test('position moves using the updated (post-gravity) velocity', () => {
  const world = createWorld();
  const gravitySystem = createGravitySystem({ x: 0, y: 100 });
  const id = world.createEntity();
  world.addComponent(id, Position, Position(0, 0));
  world.addComponent(id, Velocity, Velocity(0, 0));

  gravitySystem(world, 0.1);

  const pos = world.getComponent(id, Position);
  // semi-implicit: pos += (v0 + g*dt) * dt = (0 + 10) * 0.1 = 1
  assert.ok(Math.abs(pos.y - 1) < 1e-9);
});

test('a body with mass 0 is treated as static and ignores gravity', () => {
  const world = createWorld();
  const gravitySystem = createGravitySystem({ x: 0, y: 100 });
  const id = world.createEntity();
  world.addComponent(id, Position, Position(5, 5));
  world.addComponent(id, Velocity, Velocity(0, 0));
  world.addComponent(id, Mass, Mass(0));

  gravitySystem(world, 1);

  assert.deepEqual(world.getComponent(id, Velocity), { x: 0, y: 0 });
  assert.deepEqual(world.getComponent(id, Position), { x: 5, y: 5 });
});

test('entities missing Position or Velocity are skipped without throwing', () => {
  const world = createWorld();
  const gravitySystem = createGravitySystem();
  world.createEntity();
  assert.doesNotThrow(() => gravitySystem(world, 1 / 60));
});

test('many small steps approximate one larger step in the same direction', () => {
  const world = createWorld();
  const gravitySystem = createGravitySystem({ x: 0, y: 100 });
  const id = world.createEntity();
  world.addComponent(id, Position, Position(0, 0));
  world.addComponent(id, Velocity, Velocity(0, 0));

  for (let i = 0; i < 10; i++) gravitySystem(world, 0.01);

  const pos = world.getComponent(id, Position);
  assert.ok(pos.y > 0);
});
