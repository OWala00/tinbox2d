import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/ecs/world.js';
import { Position, Velocity, Shape, Mass } from '../src/ecs/components.js';
import { createCamera } from '../src/render/camera.js';
import { createRenderer } from '../src/render/canvas.js';

function fakeContext() {
  const calls = [];
  const ctx = { calls, fillStyle: null, strokeStyle: null };
  const record = (name) => (...args) => calls.push({ name, args, fillStyle: ctx.fillStyle, strokeStyle: ctx.strokeStyle });
  Object.assign(ctx, {
    clearRect: record('clearRect'),
    beginPath: record('beginPath'),
    arc: record('arc'),
    fill: record('fill'),
    fillRect: record('fillRect'),
    moveTo: record('moveTo'),
    lineTo: record('lineTo'),
    stroke: record('stroke'),
  });
  return ctx;
}

function addCircle(world, x, y, invStatic = false) {
  const id = world.createEntity();
  world.addComponent(id, Position, Position(x, y));
  world.addComponent(id, Velocity, Velocity(0, 0));
  world.addComponent(id, Shape, { kind: 'circle', radius: 5 });
  world.addComponent(id, Mass, Mass(invStatic ? 0 : 1));
  return id;
}

test('drawWorld clears the view and draws one fill per shape', () => {
  const ctx = fakeContext();
  const renderer = createRenderer(ctx, createCamera());
  const world = createWorld();
  addCircle(world, 0, 0);
  addCircle(world, 10, 0);

  renderer.drawWorld(world, { width: 800, height: 600 });

  assert.equal(ctx.calls[0].name, 'clearRect');
  assert.equal(ctx.calls.filter((c) => c.name === 'fill').length, 2);
});

test('entities without a Shape are not drawn', () => {
  const ctx = fakeContext();
  const renderer = createRenderer(ctx, createCamera());
  const world = createWorld();
  const id = world.createEntity();
  world.addComponent(id, Position, Position(0, 0));

  renderer.drawWorld(world, { width: 800, height: 600 });

  assert.equal(ctx.calls.filter((c) => c.name === 'fill').length, 0);
});

test('velocity vectors are only drawn when showVelocity is on', () => {
  const world = createWorld();
  const id = addCircle(world, 0, 0);
  world.getComponent(id, Velocity).x = 50;

  const off = fakeContext();
  createRenderer(off, createCamera()).drawWorld(world, { width: 800, height: 600 });
  assert.equal(off.calls.filter((c) => c.name === 'stroke').length, 0);

  const on = fakeContext();
  createRenderer(on, createCamera()).drawWorld(world, { width: 800, height: 600, showVelocity: true });
  assert.equal(on.calls.filter((c) => c.name === 'stroke').length, 1);
});

test('different dynamic bodies get different colors, so piles stay readable', () => {
  const ctx = fakeContext();
  const renderer = createRenderer(ctx, createCamera());
  const world = createWorld();
  addCircle(world, 0, 0);
  addCircle(world, 20, 0);

  renderer.drawWorld(world, { width: 800, height: 600 });

  const [first, second] = ctx.calls.filter((c) => c.name === 'fill');
  assert.match(first.fillStyle, /^hsl\(/);
  assert.notEqual(first.fillStyle, second.fillStyle);
});

test('a constraint is drawn as a line between its two bodies', () => {
  const ctx = fakeContext();
  const renderer = createRenderer(ctx, createCamera());
  const world = createWorld();
  const a = addCircle(world, 0, 0);
  const b = addCircle(world, 100, 0);

  renderer.drawWorld(world, { width: 800, height: 600, constraints: [{ a, b, length: 100 }] });

  const move = ctx.calls.find((c) => c.name === 'moveTo');
  const line = ctx.calls.find((c) => c.name === 'lineTo');
  assert.deepEqual(move.args, [400, 300]);
  assert.deepEqual(line.args, [500, 300]);
  assert.equal(ctx.calls.filter((c) => c.name === 'stroke').length, 1);
});

test('a constraint pointing at a destroyed body is skipped', () => {
  const ctx = fakeContext();
  const renderer = createRenderer(ctx, createCamera());
  const world = createWorld();
  const a = addCircle(world, 0, 0);
  const b = addCircle(world, 100, 0);
  world.destroyEntity(b);

  renderer.drawWorld(world, { width: 800, height: 600, constraints: [{ a, b, length: 100 }] });

  assert.equal(ctx.calls.filter((c) => c.name === 'stroke').length, 0);
});

test('static bodies are drawn in the static color', () => {
  const ctx = fakeContext();
  const renderer = createRenderer(ctx, createCamera());
  const world = createWorld();
  addCircle(world, 0, 0, true);

  renderer.drawWorld(world, { width: 800, height: 600 });

  const fill = ctx.calls.find((c) => c.name === 'fill');
  assert.equal(fill.fillStyle, '#6b6b6b');
});
