// bodies here are plain objects: { position: {x,y}, invMass: number }.
// invMass of 0 means static/infinite mass. manifold is { normal, depth }
// as produced by narrowphase.js, with normal pointing from a toward b.

export function resolvePosition(a, b, manifold) {
  const totalInvMass = a.invMass + b.invMass;
  if (totalInvMass === 0) return; // both static, nothing to do

  const correction = manifold.depth / totalInvMass;
  a.position.x -= manifold.normal.x * correction * a.invMass;
  a.position.y -= manifold.normal.y * correction * a.invMass;
  b.position.x += manifold.normal.x * correction * b.invMass;
  b.position.y += manifold.normal.y * correction * b.invMass;
}
