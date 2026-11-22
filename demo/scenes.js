import { Position, Velocity, Shape, Mass, Material } from '../src/ecs/components.js';

export const ARENA = { minX: -320, minY: -240, maxX: 320, maxY: 240 };

function mulberry32(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addBody(world, { x, y, shape, mass = 1, material = Material(), vx = 0, vy = 0 }) {
  const id = world.createEntity();
  world.addComponent(id, Position, Position(x, y));
  world.addComponent(id, Velocity, Velocity(vx, vy));
  world.addComponent(id, Shape, shape);
  world.addComponent(id, Mass, Mass(mass));
  world.addComponent(id, Material, material);
  return id;
}

export function addStaticBox(world, x, y, width, height) {
  return addBody(world, { x, y, shape: { kind: 'box', width, height }, mass: 0, material: Material(0.3, 0.5) });
}

export function spawnCircle(world, x, y, { radius = 10 + Math.random() * 10, restitution = 0.5, friction = 0.4, vx = 0, vy = 0 } = {}) {
  return addBody(world, {
    x, y, vx, vy,
    shape: { kind: 'circle', radius },
    material: Material(restitution, friction),
  });
}

export function spawnBox(world, x, y, { width = 22 + Math.random() * 22, height = 22 + Math.random() * 22, restitution = 0.5, friction = 0.4, vx = 0, vy = 0 } = {}) {
  return addBody(world, {
    x, y, vx, vy,
    shape: { kind: 'box', width, height },
    material: Material(restitution, friction),
  });
}

function addWalls(world) {
  addStaticBox(world, 0, ARENA.minY - 10, 680, 20);
  addStaticBox(world, 0, ARENA.maxY + 10, 680, 20);
  addStaticBox(world, ARENA.minX - 10, 0, 20, 520);
  addStaticBox(world, ARENA.maxX + 10, 0, 20, 520);
}

function buildSandbox(world) {
  addWalls(world);
  addStaticBox(world, -170, -110, 240, 16);
  addStaticBox(world, 170, 10, 240, 16);
  addStaticBox(world, -150, 120, 200, 16);

  const rng = mulberry32(21);
  for (let i = 0; i < 10; i++) {
    const x = ARENA.minX + 40 + rng() * (ARENA.maxX - ARENA.minX - 80);
    const y = 160 + rng() * 65;
    const vx = (rng() - 0.5) * 60;
    if (i % 2 === 0) {
      spawnCircle(world, x, y, { radius: 10 + rng() * 10, restitution: 0.4, vx });
    } else {
      spawnBox(world, x, y, { width: 22 + rng() * 22, height: 22 + rng() * 22, restitution: 0.4, vx });
    }
  }
}

function buildBounce(world) {
  addWalls(world);
  const rng = mulberry32(7);
  for (let i = 0; i < 20; i++) {
    spawnCircle(world, ARENA.minX + 40 + rng() * (ARENA.maxX - ARENA.minX - 80), ARENA.minY + 40 + rng() * (ARENA.maxY - ARENA.minY - 80), {
      radius: 10 + rng() * 8,
      restitution: 0.6,
      friction: 0.3,
      vx: (rng() - 0.5) * 120,
      vy: (rng() - 0.5) * 60,
    });
  }
}

function buildStack(world) {
  addWalls(world);
  const boxW = 40;
  const boxH = 24;
  const gap = 2;
  const rows = 4;
  for (let row = 0; row < rows; row++) {
    const count = rows - row;
    for (let i = 0; i < count; i++) {
      spawnBox(world, (i - (count - 1) / 2) * (boxW + gap), ARENA.minY + boxH / 2 + row * (boxH + gap), {
        width: boxW,
        height: boxH,
        restitution: 0.2,
        friction: 0.5,
      });
    }
  }
}

function buildPendulum(world, solver) {
  const length = 180;
  const anchor = addBody(world, { x: 0, y: 150, shape: { kind: 'circle', radius: 4 }, mass: 0 });
  const angle = Math.PI / 4;
  const bob = spawnCircle(world, length * Math.sin(angle), 150 - length * Math.cos(angle), {
    radius: 14,
    restitution: 0.2,
    friction: 0.3,
  });
  solver.addDistance(anchor, bob, length);
}

export const SCENES = {
  1: { name: 'balls', bounds: ARENA, build: buildBounce },
  2: { name: 'pyramid', bounds: ARENA, build: buildStack },
  3: { name: 'pendulum', bounds: { minX: -240, minY: -200, maxX: 240, maxY: 180 }, build: buildPendulum },
  4: { name: 'sandbox', bounds: ARENA, build: buildSandbox },
};
