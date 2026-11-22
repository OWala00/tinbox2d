import { Position, Velocity, Mass } from '../ecs/components.js';

const BAUMGARTE = 0.2;

function inverseMass(world, id) {
  const mass = world.getComponent(id, Mass);
  if (!mass) return 1;
  return mass.value === 0 ? 0 : 1 / mass.value;
}

// keeps two entities exactly `length` apart. solved as a velocity impulse
// along the rod, with a Baumgarte bias that pulls any drift back over ticks.
function solveDistance(world, constraint, dt) {
  const pa = world.getComponent(constraint.a, Position);
  const pb = world.getComponent(constraint.b, Position);
  const va = world.getComponent(constraint.a, Velocity);
  const vb = world.getComponent(constraint.b, Velocity);
  const wa = inverseMass(world, constraint.a);
  const wb = inverseMass(world, constraint.b);
  const wSum = wa + wb;
  if (wSum === 0) return;

  const dx = pb.x - pa.x;
  const dy = pb.y - pa.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const error = dist - constraint.length;
  const bias = (BAUMGARTE / dt) * error;
  const relVel = (vb.x - va.x) * nx + (vb.y - va.y) * ny;
  const lambda = -(relVel + bias) / wSum;

  va.x -= nx * lambda * wa;
  va.y -= ny * lambda * wa;
  vb.x += nx * lambda * wb;
  vb.y += ny * lambda * wb;
}

export function createConstraintSolver(iterations = 8) {
  const constraints = [];

  return {
    addDistance(a, b, length) {
      constraints.push({ a, b, length });
    },
    count() {
      return constraints.length;
    },
    list() {
      return constraints;
    },
    system(world, dt) {
      for (let i = 0; i < iterations; i++) {
        for (const constraint of constraints) {
          if (!world.isAlive(constraint.a) || !world.isAlive(constraint.b)) continue;
          solveDistance(world, constraint, dt);
        }
      }
    },
  };
}
