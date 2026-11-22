import { Position, Velocity, Shape, Mass, Material } from '../ecs/components.js';
import { fromCircle } from '../math/aabb.js';
import { createSpatialGrid } from './broadphase.js';
import { circleVsCircle, aabbVsAabb, aabbVsCircle } from './narrowphase.js';
import { resolvePosition, resolveVelocity, resolveFriction } from './resolver.js';

function boxAabb(pos, shape) {
  const halfW = shape.width / 2;
  const halfH = shape.height / 2;
  return { minX: pos.x - halfW, minY: pos.y - halfH, maxX: pos.x + halfW, maxY: pos.y + halfH };
}

function circleOf(body) {
  return { x: body.position.x, y: body.position.y, radius: body.shape.radius };
}

function bodyAabb(body) {
  return body.shape.kind === 'circle'
    ? fromCircle(body.position, body.shape.radius)
    : boxAabb(body.position, body.shape);
}

// normal always points from a toward b, same as the narrowphase functions.
function contact(a, b) {
  const aCircle = a.shape.kind === 'circle';
  const bCircle = b.shape.kind === 'circle';
  if (aCircle && bCircle) return circleVsCircle(circleOf(a), circleOf(b));
  if (!aCircle && !bCircle) return aabbVsAabb(bodyAabb(a), bodyAabb(b));
  if (!aCircle) return aabbVsCircle(bodyAabb(a), circleOf(b));
  const hit = aabbVsCircle(bodyAabb(b), circleOf(a));
  if (!hit) return null;
  return { normal: { x: -hit.normal.x, y: -hit.normal.y }, depth: hit.depth };
}

function collectBodies(world) {
  const bodies = [];
  for (const id of world.entities()) {
    const position = world.getComponent(id, Position);
    const shape = world.getComponent(id, Shape);
    const velocity = world.getComponent(id, Velocity);
    if (!position || !shape || !velocity) continue;
    const mass = world.getComponent(id, Mass);
    const material = world.getComponent(id, Material) ?? Material();
    const body = {
      id,
      position,
      velocity,
      shape,
      invMass: mass && mass.value === 0 ? 0 : 1 / (mass ? mass.value : 1),
      restitution: material.restitution,
      friction: material.friction,
    };
    body.aabb = bodyAabb(body);
    bodies.push(body);
  }
  return bodies;
}

// runs broadphase -> narrowphase -> response. the whole pass repeats a few
// times per tick so stacked bodies converge instead of sinking into each other.
export function createCollisionSystem({ cellSize = 96, iterations = 4 } = {}) {
  const grid = createSpatialGrid(cellSize);

  return function collisionSystem(world) {
    for (let pass = 0; pass < iterations; pass++) {
      const bodies = collectBodies(world);
      const byId = new Map(bodies.map((body) => [body.id, body]));
      const entries = bodies.map((body) => ({ id: body.id, aabb: body.aabb }));

      for (const [idA, idB] of grid.query(entries)) {
        const a = byId.get(idA);
        const b = byId.get(idB);
        if (a.invMass === 0 && b.invMass === 0) continue;

        const manifold = contact(a, b);
        if (!manifold) continue;

        const restitution = (a.restitution + b.restitution) / 2;
        const friction = Math.sqrt(a.friction * b.friction);
        resolvePosition(a, b, manifold);
        const normalImpulse = resolveVelocity(a, b, manifold, restitution);
        resolveFriction(a, b, manifold, friction, normalImpulse);
      }
    }
  };
}
