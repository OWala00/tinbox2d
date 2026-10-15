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

      vel.x += gravity.x * dt;
      vel.y += gravity.y * dt;
      pos.x += vel.x * dt;
      pos.y += vel.y * dt;
    }
  };
}
