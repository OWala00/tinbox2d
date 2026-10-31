// bodies here are plain objects: { position: {x,y}, velocity: {x,y},
// invMass: number }. invMass of 0 means static/infinite mass. manifold is
// { normal, depth } as produced by narrowphase.js, normal pointing a -> b.

export function resolvePosition(a, b, manifold) {
  const totalInvMass = a.invMass + b.invMass;
  if (totalInvMass === 0) return; // both static, nothing to do

  const correction = manifold.depth / totalInvMass;
  a.position.x -= manifold.normal.x * correction * a.invMass;
  a.position.y -= manifold.normal.y * correction * a.invMass;
  b.position.x += manifold.normal.x * correction * b.invMass;
  b.position.y += manifold.normal.y * correction * b.invMass;
}

// restitution of 1 is a perfectly elastic bounce, 0 is perfectly inelastic
// (bodies end up moving together along the normal). returns the scalar
// impulse magnitude applied along the normal, used later to clamp friction.
export function resolveVelocity(a, b, manifold, restitution) {
  const totalInvMass = a.invMass + b.invMass;
  if (totalInvMass === 0) return 0;

  const relVel = { x: b.velocity.x - a.velocity.x, y: b.velocity.y - a.velocity.y };
  const velAlongNormal = relVel.x * manifold.normal.x + relVel.y * manifold.normal.y;
  // already separating, don't add an impulse that would pull them together
  if (velAlongNormal > 0) return 0;

  const j = (-(1 + restitution) * velAlongNormal) / totalInvMass;
  const impulse = { x: manifold.normal.x * j, y: manifold.normal.y * j };

  a.velocity.x -= impulse.x * a.invMass;
  a.velocity.y -= impulse.y * a.invMass;
  b.velocity.x += impulse.x * b.invMass;
  b.velocity.y += impulse.y * b.invMass;

  return j;
}

// coulomb friction: the tangential impulse is clamped to friction * the
// normal impulse magnitude from resolveVelocity, so friction can never
// exceed what the normal force would actually allow.
export function resolveFriction(a, b, manifold, friction, normalImpulse) {
  const totalInvMass = a.invMass + b.invMass;
  if (totalInvMass === 0) return;

  const relVel = { x: b.velocity.x - a.velocity.x, y: b.velocity.y - a.velocity.y };
  const velAlongNormal = relVel.x * manifold.normal.x + relVel.y * manifold.normal.y;
  const tangentRaw = {
    x: relVel.x - manifold.normal.x * velAlongNormal,
    y: relVel.y - manifold.normal.y * velAlongNormal,
  };
  const tangentLen = Math.sqrt(tangentRaw.x * tangentRaw.x + tangentRaw.y * tangentRaw.y);
  if (tangentLen === 0) return; // no relative sliding, nothing to resist

  const tangent = { x: tangentRaw.x / tangentLen, y: tangentRaw.y / tangentLen };
  const velAlongTangent = relVel.x * tangent.x + relVel.y * tangent.y;

  let jt = -velAlongTangent / totalInvMass;
  const maxFriction = friction * Math.abs(normalImpulse);
  jt = Math.max(-maxFriction, Math.min(maxFriction, jt));

  const impulse = { x: tangent.x * jt, y: tangent.y * jt };
  a.velocity.x -= impulse.x * a.invMass;
  a.velocity.y -= impulse.y * a.invMass;
  b.velocity.x += impulse.x * b.invMass;
  b.velocity.y += impulse.y * b.invMass;
}
