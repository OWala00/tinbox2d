import { Position, Velocity, Mass } from '../ecs/components.js';

// semi-implicit (symplectic) euler: update velocity first, then use the
// updated velocity to move position. more stable for simulation than
// updating both from the same old velocity.
export function createGravitySystem(gravity = { x: 0, y: 500 }) {
  return function gravitySystem(world, dt) {
    for (const id of world.entities()) {
      const mass = world.getComponent(id, Mass);
      const vel = world.getComponent(id, Velocity);
      const pos = world.getComponent(id, Position);
      if (!vel || !pos) continue;
      // mass of 0 means static/infinite mass: not affected by gravity.
      if (mass && mass.value === 0) continue;
      if (vel.sleeping) continue;

      vel.x += gravity.x * dt;
      vel.y += gravity.y * dt;
      pos.x += vel.x * dt;
      pos.y += vel.y * dt;
    }
  };
}

// linear damping slows a body down every tick, independent of collisions.
// without this, floating point drift and repeated small impulses tend to
// leave bodies with a faint residual velocity that never quite settles.
const DEFAULT_SLEEP_THRESHOLD = 0.05;

export function createDampingSystem(damping = 0.02, sleepThreshold = DEFAULT_SLEEP_THRESHOLD) {
  return function dampingSystem(world, dt) {
    for (const id of world.entities()) {
      const vel = world.getComponent(id, Velocity);
      if (!vel) continue;

      const factor = Math.max(0, 1 - damping * dt * 60);
      vel.x *= factor;
      vel.y *= factor;

      const speedSq = vel.x * vel.x + vel.y * vel.y;
      vel.sleeping = speedSq < sleepThreshold * sleepThreshold;
    }
  };
}
