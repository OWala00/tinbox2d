import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/ecs/world.js';
import { Position, Velocity, Shape, Mass, Material } from '../src/ecs/components.js';
import { createGravitySystem, createDampingSystem } from '../src/physics/integrator.js';
import { createCollisionSystem } from '../src/physics/collision.js';
import { createConstraintSolver } from '../src/physics/constraints.js';

const DT = 1 / 60;

function body(world, { x, y, shape, mass = 1, restitution = 0, friction = 0.3, vx = 0, vy = 0 }) {
  const id = world.createEntity();
  world.addComponent(id, Position, Position(x, y));
  world.addComponent(id, Velocity, Velocity(vx, vy));
  world.addComponent(id, Shape, shape);
  world.addComponent(id, Mass, Mass(mass));
  world.addComponent(id, Material, Material(restitution, friction));
  return id;
}

function simulate(world, ticks, { gravity = { x: 0, y: -600 }, solver = null } = {}) {
  const gravitySystem = createGravitySystem(gravity);
  const collisionSystem = createCollisionSystem();
  const dampingSystem = createDampingSystem(0.02);
  for (let i = 0; i < ticks; i++) {
    gravitySystem(world, DT);
    if (solver) solver.system(world, DT);
    collisionSystem(world, DT);
    dampingSystem(world, DT);
  }
}

test('two overlapping circles are pushed apart by the collision system', () => {
  const world = createWorld();
  const a = body(world, { x: 0, y: 0, shape: { kind: 'circle', radius: 10 } });
  const b = body(world, { x: 15, y: 0, shape: { kind: 'circle', radius: 10 } });

  createCollisionSystem()(world, DT);

  const pa = world.getComponent(a, Position);
  const pb = world.getComponent(b, Position);
  const dist = Math.hypot(pb.x - pa.x, pb.y - pa.y);
  assert.ok(dist >= 20 - 1e-6);
});

test('a circle dropped onto a static floor comes to rest on top of it', () => {
  const world = createWorld();
  const ball = body(world, { x: 0, y: 100, shape: { kind: 'circle', radius: 10 }, restitution: 0 });
  body(world, { x: 0, y: -230, shape: { kind: 'box', width: 600, height: 20 }, mass: 0 });

  simulate(world, 240);

  const y = world.getComponent(ball, Position).y;
  const floorTop = -220;
  assert.ok(y > floorTop + 10 - 2, `ball sank into the floor: y=${y}`);
  assert.ok(y < floorTop + 10 + 2, `ball is floating: y=${y}`);
});

test('a bouncy ball rebounds off the floor', () => {
  const world = createWorld();
  const ball = body(world, { x: 0, y: 100, shape: { kind: 'circle', radius: 10 }, restitution: 0.8 });
  body(world, { x: 0, y: -230, shape: { kind: 'box', width: 600, height: 20 }, mass: 0, restitution: 0.8 });

  let maxYAfterImpact = -Infinity;
  let impacted = false;
  const gravitySystem = createGravitySystem({ x: 0, y: -600 });
  const collisionSystem = createCollisionSystem();
  for (let i = 0; i < 300; i++) {
    gravitySystem(world, DT);
    collisionSystem(world, DT);
    const vel = world.getComponent(ball, Velocity);
    if (vel.y > 50) impacted = true;
    if (impacted) maxYAfterImpact = Math.max(maxYAfterImpact, world.getComponent(ball, Position).y);
  }

  assert.ok(impacted, 'the ball never bounced upward');
  assert.ok(maxYAfterImpact > -200, `ball did not rise after impact: ${maxYAfterImpact}`);
});

test('a box stacked on a box stays on top instead of sinking through', () => {
  const world = createWorld();
  const floor = body(world, { x: 0, y: -230, shape: { kind: 'box', width: 600, height: 20 }, mass: 0 });
  const lower = body(world, { x: 0, y: -210, shape: { kind: 'box', width: 40, height: 24 }, mass: 1, friction: 0.5 });
  const upper = body(world, { x: 0, y: -180, shape: { kind: 'box', width: 40, height: 24 }, mass: 1, friction: 0.5 });

  simulate(world, 240);

  const lowerY = world.getComponent(lower, Position).y;
  const upperY = world.getComponent(upper, Position).y;
  assert.ok(Math.abs(lowerY - -208) < 1, `lower box not resting on floor: ${lowerY}`);
  assert.ok(upperY - lowerY > 20, `upper box sank into lower: ${upperY - lowerY}`);
  assert.equal(world.getComponent(floor, Position).y, -230);
});
