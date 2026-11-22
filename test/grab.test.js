import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/ecs/world.js';
import { Position, Velocity, Mass } from '../src/ecs/components.js';
import { createGravitySystem } from '../src/physics/integrator.js';
import { createGrab } from '../src/physics/grab.js';

const DT = 1 / 60;

function body(world, x, y) {
  const id = world.createEntity();
  world.addComponent(id, Position, Position(x, y));
  world.addComponent(id, Velocity, Velocity(0, 0));
  world.addComponent(id, Mass, Mass(1));
  return id;
}

function run(world, grab, ticks) {
  const drift = createGravitySystem({ x: 0, y: 0 });
  for (let i = 0; i < ticks; i++) {
    grab.system(world, DT);
    drift(world, DT);
  }
}

test('a grabbed body is pulled to the target point', () => {
  const world = createWorld();
  const id = body(world, 0, 0);
  const grab = createGrab();
  grab.start(id, { x: 0, y: 0 });
  grab.move({ x: 100, y: 60 });

  run(world, grab, 120);

  const pos = world.getComponent(id, Position);
  assert.ok(Math.hypot(pos.x - 100, pos.y - 60) < 1);
});

test('moving the target while held drags the body along', () => {
  const world = createWorld();
  const id = body(world, 0, 0);
  const grab = createGrab();
  grab.start(id, { x: 0, y: 0 });
  grab.move({ x: 50, y: 0 });
  run(world, grab, 60);
  grab.move({ x: -50, y: 0 });
  run(world, grab, 120);

  assert.ok(Math.abs(world.getComponent(id, Position).x - -50) < 1);
});

test('after release the body keeps its velocity so it can be thrown', () => {
  const world = createWorld();
  const id = body(world, 0, 0);
  const grab = createGrab();
  grab.start(id, { x: 0, y: 0 });
  grab.move({ x: 200, y: 0 });
  run(world, grab, 5);
  const speedAtRelease = world.getComponent(id, Velocity).x;

  grab.release();
  run(world, grab, 10);

  assert.ok(speedAtRelease > 100);
  assert.equal(world.getComponent(id, Velocity).x, speedAtRelease);
  assert.equal(grab.id, null);
});

test('the pull speed is capped so a far-away cursor cannot launch a body to infinity', () => {
  const world = createWorld();
  const id = body(world, 0, 0);
  const grab = createGrab();
  grab.start(id, { x: 0, y: 0 });
  grab.move({ x: 1e6, y: 0 });

  grab.system(world, DT);

  const vel = world.getComponent(id, Velocity);
  assert.ok(Math.hypot(vel.x, vel.y) <= 1800 + 1e-9);
});

test('grabbing a body that is then destroyed does not throw', () => {
  const world = createWorld();
  const id = body(world, 0, 0);
  const grab = createGrab();
  grab.start(id, { x: 0, y: 0 });
  world.destroyEntity(id);

  assert.doesNotThrow(() => grab.system(world, DT));
  assert.equal(grab.id, null);
});

test('with nothing grabbed the system does nothing', () => {
  const world = createWorld();
  const id = body(world, 3, 4);
  createGrab().system(world, DT);
  assert.deepEqual(world.getComponent(id, Velocity), { x: 0, y: 0 });
});
