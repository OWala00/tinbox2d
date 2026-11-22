import { Position, Velocity, Shape, Mass } from '../ecs/components.js';

const STATIC_COLOR = '#6b6b6b';
const VELOCITY_COLOR = '#ffcc33';
const ROD_COLOR = '#8a94a6';
const VELOCITY_SCALE = 0.1;

// every dynamic body gets its own hue from its id so piles stay readable;
// slow bodies are drawn a little darker.
function bodyColor(id, mass, vel) {
  if (mass && mass.value === 0) return STATIC_COLOR;
  const lightness = vel && vel.sleeping ? 46 : 62;
  return `hsl(${(id * 47) % 360}, 70%, ${lightness}%)`;
}

export function createRenderer(ctx, camera) {
  function drawWorld(world, { width, height, showVelocity = false, constraints = [] }) {
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = ROD_COLOR;
    ctx.lineWidth = 2;
    for (const constraint of constraints) {
      const a = world.getComponent(constraint.a, Position);
      const b = world.getComponent(constraint.b, Position);
      if (!a || !b) continue;
      const from = camera.worldToScreen(a, width, height);
      const to = camera.worldToScreen(b, width, height);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
    ctx.lineWidth = 1;

    for (const id of world.entities()) {
      const pos = world.getComponent(id, Position);
      const shape = world.getComponent(id, Shape);
      if (!pos || !shape) continue;
      const vel = world.getComponent(id, Velocity);
      const mass = world.getComponent(id, Mass);
      const center = camera.worldToScreen(pos, width, height);

      ctx.fillStyle = bodyColor(id, mass, vel);
      if (shape.kind === 'circle') {
        ctx.beginPath();
        ctx.arc(center.x, center.y, shape.radius * camera.zoom, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const halfW = (shape.width / 2) * camera.zoom;
        const halfH = (shape.height / 2) * camera.zoom;
        ctx.fillRect(center.x - halfW, center.y - halfH, halfW * 2, halfH * 2);
      }

      if (showVelocity && vel && !(mass && mass.value === 0)) {
        ctx.strokeStyle = VELOCITY_COLOR;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(
          center.x + vel.x * VELOCITY_SCALE * camera.zoom,
          center.y - vel.y * VELOCITY_SCALE * camera.zoom,
        );
        ctx.stroke();
      }
    }
  }

  return { drawWorld };
}
