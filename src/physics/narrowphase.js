import { sub, length, normalize } from '../math/vec2.js';

// a circle is { x, y, radius }. returns null when there's no overlap, or
// { normal, depth } when there is. normal always points from a toward b.
export function circleVsCircle(a, b) {
  const delta = sub(b, a);
  const dist = length(delta);
  const radiusSum = a.radius + b.radius;
  if (dist >= radiusSum) return null;

  const normal = dist === 0 ? { x: 1, y: 0 } : normalize(delta);
  const depth = radiusSum - dist;
  return { normal, depth };
}

// an AABB here is { minX, minY, maxX, maxY }, same shape as src/math/aabb.js.
export function aabbVsAabb(a, b) {
  const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const overlapY = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
  if (overlapX <= 0 || overlapY <= 0) return null;

  // minimum translation vector: push out along whichever axis has less
  // overlap, since that's the cheaper separation.
  if (overlapX < overlapY) {
    const centerA = (a.minX + a.maxX) / 2;
    const centerB = (b.minX + b.maxX) / 2;
    const normal = centerB >= centerA ? { x: 1, y: 0 } : { x: -1, y: 0 };
    return { normal, depth: overlapX };
  }
  const centerA = (a.minY + a.maxY) / 2;
  const centerB = (b.minY + b.maxY) / 2;
  const normal = centerB >= centerA ? { x: 0, y: 1 } : { x: 0, y: -1 };
  return { normal, depth: overlapY };
}

export function aabbVsCircle(box, circle) {
  const closestX = Math.max(box.minX, Math.min(circle.x, box.maxX));
  const closestY = Math.max(box.minY, Math.min(circle.y, box.maxY));
  const delta = { x: circle.x - closestX, y: circle.y - closestY };
  const dist = length(delta);
  if (dist >= circle.radius) return null;

  // circle center inside the box: closest point equals the center, delta is
  // zero, so fall back to pushing along the axis of least penetration.
  if (dist === 0) {
    const overlapX = Math.min(box.maxX - circle.x, circle.x - box.minX);
    const overlapY = Math.min(box.maxY - circle.y, circle.y - box.minY);
    const normal = overlapX < overlapY ? { x: 1, y: 0 } : { x: 0, y: 1 };
    return { normal, depth: circle.radius + Math.min(overlapX, overlapY) };
  }

  const normal = normalize(delta);
  const depth = circle.radius - dist;
  return { normal, depth };
}
