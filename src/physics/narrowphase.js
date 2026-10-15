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
