import { Position, Shape, Mass } from '../ecs/components.js';

function contains(pos, shape, point) {
  if (shape.kind === 'circle') {
    const dx = point.x - pos.x;
    const dy = point.y - pos.y;
    return dx * dx + dy * dy <= shape.radius * shape.radius;
  }
  return Math.abs(point.x - pos.x) <= shape.width / 2 && Math.abs(point.y - pos.y) <= shape.height / 2;
}

// returns the id of the topmost (last created) body under the point, or null.
export function bodyAt(world, point, { dynamicOnly = true } = {}) {
  let found = null;
  for (const id of world.entities()) {
    const pos = world.getComponent(id, Position);
    const shape = world.getComponent(id, Shape);
    if (!pos || !shape) continue;
    const mass = world.getComponent(id, Mass);
    if (dynamicOnly && mass && mass.value === 0) continue;
    if (contains(pos, shape, point)) found = id;
  }
  return found;
}
