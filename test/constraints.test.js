import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/ecs/world.js';
import { Position, Velocity, Shape, Mass, Material } from '../src/ecs/components.js';
import { createGravitySystem, createDampingSystem } from '../src/physics/integrator.js';
import { createCollisionSystem } from '../src/physics/collision.js';
import { createConstraintSolver } from '../src/physics/constraints.js';

const DT = 1 / 60;

function body(world, { x, y, mass = 1, radius = 10 }) {
  const id = world.createEntity();
  world.addComponent(id, Position, Position(x, y));
  world.addComponent(id, Velocity, Velocity(0, 0));
  world.addComponent(id, Shape, { kind: 'circle', radius });
  world.addComponent(id, Mass, Mass(mass));
  world.addComponent(id, Material, Material(0.2, 0.3));
  return id;
}

function distance(world, a, b) {
  const pa = world.getComponent(a, Position);
  const pb = world.getComponent(b, Position);
  return Math.hypot(pb.x - pa.x, pb.y - pa.y);
}

test('a distance constraint reports how many constraints it holds', () => {
  const solver = createConstraintSolver();
  assert.equal(solver.count(), 0);
  solver.addDistance(0, 1, 100);
  assert.equal(solver.count(), 1);
});

test('a constraint whose body was destroyed is skipped instead of throwing', () => {
  const world = createWorld();
  const a = body(world, { x: 0, y: 0, mass: 0 });
  const b = body(world, { x: 100, y: 0 });
  const solver = createConstraintSolver();
  solver.addDistance(a, b, 100);
  world.destroyEntity(b);

  assert.doesNotThrow(() => solver.system(world, DT));
});

test('a bob connected to a static anchor keeps its rod length while swinging', () => {
  const world = createWorld();
  const anchor = body(world, { x: 0, y: 150, mass: 0, radius: 4 });
  const length = 180;
  const bob = body(world, { x: length * Math.SQRT1_2, y: 150 - length * Math.SQRT1_2, radius: 14 });
  const solver = createConstraintSolver();
  solver.addDistance(anchor, bob, length);

  const gravitySystem = createGravitySystem({ x: 0, y: -600 });
  const collisionSystem = createCollisionSystem();
  const dampingSystem = createDampingSystem(0.02);
  let worstError = 0;
  for (let i = 0; i < 300; i++) {
    gravitySystem(world, DT);
    solver.system(world, DT);
    collisionSystem(world, DT);
    dampingSystem(world, DT);
    worstError = Math.max(worstError, Math.abs(distance(world, anchor, bob) - length));
  }

  assert.ok(worstError < length * 0.02, `rod stretched by ${worstError.toFixed(2)} units`);
});

test('the bob actually swings: it moves from its starting position', () => {
  const world = createWorld();
  const anchor = body(world, { x: 0, y: 150, mass: 0, radius: 4 });
  const length = 180;
  const bob = body(world, { x: length * Math.SQRT1_2, y: 150 - length * Math.SQRT1_2, radius: 14 });
  const solver = createConstraintSolver();
  solver.addDistance(anchor, bob, length);

  const gravitySystem = createGravitySystem({ x: 0, y: -600 });
  const start = { ...world.getComponent(bob, Position) };
  for (let i = 0; i < 60; i++) {
    gravitySystem(world, DT);
    solver.system(world, DT);
  }

  const end = world.getComponent(bob, Position);
  assert.ok(Math.hypot(end.x - start.x, end.y - start.y) > 10);
});

test('a distance constraint between two free bodies pulls them to its length', () => {
  const world = createWorld();
  const a = body(world, { x: 0, y: 0 });
  const b = body(world, { x: 300, y: 0 });
  const solver = createConstraintSolver();
  solver.addDistance(a, b, 100);
  const drift = createGravitySystem({ x: 0, y: 0 });

  for (let i = 0; i < 300; i++) {
    solver.system(world, DT);
    drift(world, DT);
  }

  const d = distance(world, a, b);
  assert.ok(Math.abs(d - 100) < 5, `distance did not converge to 100: ${d}`);
});
