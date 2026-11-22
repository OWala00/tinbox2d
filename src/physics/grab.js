import { Position, Velocity } from '../ecs/components.js';

const GAIN = 18;
const MAX_SPEED = 1800;

// drags one body toward a target point by steering its velocity, so it still
// collides with everything on the way. whatever velocity it has on release is
// what throws it.
export function createGrab() {
  let grabbed = null;
  let target = null;

  return {
    get id() {
      return grabbed;
    },
    get target() {
      return target;
    },
    start(id, point) {
      grabbed = id;
      target = { x: point.x, y: point.y };
    },
    move(point) {
      if (grabbed !== null) target = { x: point.x, y: point.y };
    },
    release() {
      grabbed = null;
      target = null;
    },
    system(world) {
      if (grabbed === null) return;
      if (!world.isAlive(grabbed)) {
        grabbed = null;
        target = null;
        return;
      }
      const pos = world.getComponent(grabbed, Position);
      const vel = world.getComponent(grabbed, Velocity);
      let vx = (target.x - pos.x) * GAIN;
      let vy = (target.y - pos.y) * GAIN;
      const speed = Math.hypot(vx, vy);
      if (speed > MAX_SPEED) {
        vx = (vx / speed) * MAX_SPEED;
        vy = (vy / speed) * MAX_SPEED;
      }
      vel.x = vx;
      vel.y = vy;
    },
  };
}
