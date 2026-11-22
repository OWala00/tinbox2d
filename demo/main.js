import { createWorld } from '../src/ecs/world.js';
import { attachSystems } from '../src/ecs/system.js';
import { Position, Mass } from '../src/ecs/components.js';
import { createGravitySystem, createDampingSystem } from '../src/physics/integrator.js';
import { createCollisionSystem } from '../src/physics/collision.js';
import { createConstraintSolver } from '../src/physics/constraints.js';
import { createGrab } from '../src/physics/grab.js';
import { bodyAt } from '../src/physics/query.js';
import { createRenderer } from '../src/render/canvas.js';
import { createCamera } from '../src/render/camera.js';
import { startGameLoop } from '../src/core/loop.js';
import { SCENES, spawnCircle, spawnBox, addStaticBox } from './scenes.js';

const MAX_BODIES = 300;
const SPRAY_MS = 90;
const FIXED_DT = 1 / 60;
const HINTS = {
  circle: 'Click or hold to drop circles',
  box: 'Click or hold to drop boxes',
  grab: 'Drag a body to pick it up, release to throw it',
  wall: 'Drag out a rectangle to build a static wall',
};
const CURSORS = { circle: 'crosshair', box: 'crosshair', grab: 'grab', wall: 'cell' };

const stage = document.getElementById('stage');
const canvas = document.getElementById('view');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const hint = document.getElementById('hint');
const pauseButton = document.getElementById('pause');
const gravityInput = document.getElementById('gravity');
const bounceInput = document.getElementById('bounce');
const velocityInput = document.getElementById('velocity');
const params = new URLSearchParams(window.location.search);

const gravity = { x: 0, y: -Number(gravityInput.value) };
const gravitySystem = createGravitySystem(gravity);
const dampingSystem = createDampingSystem(0.02);
const collisionSystem = createCollisionSystem();
const grab = createGrab();
const camera = createCamera();
const renderer = createRenderer(ctx, camera);

let world;
let systems;
let solver;
let sceneKey = 4;
let tool = 'circle';
let paused = false;
let autoFit = true;
let simTime = 0;
let viewW = 0;
let viewH = 0;
let frames = 0;
let fps = 0;
let fpsWindowStart = performance.now();
let hudUpdated = 0;
let wallDrag = null;
let panFrom = null;
let spray = null;

function dynamicCount() {
  let count = 0;
  for (const id of world.entities()) {
    const mass = world.getComponent(id, Mass);
    if (!mass || mass.value > 0) count++;
  }
  return count;
}

function entityCount() {
  let count = 0;
  for (const _ of world.entities()) count++;
  return count;
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const rect = stage.getBoundingClientRect();
  viewW = Math.max(1, rect.width);
  viewH = Math.max(1, rect.height);
  canvas.width = Math.round(viewW * dpr);
  canvas.height = Math.round(viewH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (autoFit) camera.fit(SCENES[sceneKey].bounds, viewW, viewH);
}

function loadScene(key) {
  sceneKey = key;
  world = createWorld();
  solver = createConstraintSolver();
  SCENES[key].build(world, solver);
  systems = attachSystems(world);
  systems.registerSystem(grab.system);
  systems.registerSystem(gravitySystem);
  systems.registerSystem(solver.system);
  systems.registerSystem(collisionSystem);
  systems.registerSystem(dampingSystem);
  grab.release();
  wallDrag = null;
  autoFit = true;
  camera.fit(SCENES[key].bounds, viewW, viewH);
  simTime = 0;
  for (const button of document.querySelectorAll('[data-scene]')) {
    button.classList.toggle('active', Number(button.dataset.scene) === key);
  }
}

function setTool(name) {
  tool = name;
  for (const button of document.querySelectorAll('[data-tool]')) {
    button.classList.toggle('active', button.dataset.tool === name);
  }
  hint.textContent = `${HINTS[name]}  ·  right-drag to pan, wheel to zoom`;
  canvas.style.cursor = CURSORS[name];
}

function setPaused(value) {
  paused = value;
  pauseButton.textContent = paused ? 'Resume' : 'Pause';
  pauseButton.classList.toggle('active', paused);
}

function clearBodies() {
  grab.release();
  for (const id of [...world.entities()]) {
    const mass = world.getComponent(id, Mass);
    if (!mass || mass.value > 0) world.destroyEntity(id);
  }
}

function insideArena(point) {
  const b = SCENES[sceneKey].bounds;
  return point.x > b.minX && point.x < b.maxX && point.y > b.minY && point.y < b.maxY;
}

function spawnAt(point) {
  if (dynamicCount() >= MAX_BODIES || !insideArena(point)) return;
  const options = { restitution: Number(bounceInput.value), vx: (Math.random() - 0.5) * 80 };
  if (tool === 'circle') spawnCircle(world, point.x, point.y, options);
  else spawnBox(world, point.x, point.y, options);
}

function screenPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function worldPoint(event) {
  return camera.screenToWorld(screenPoint(event), viewW, viewH);
}

function stopSpray() {
  if (spray) clearInterval(spray.timer);
  spray = null;
}

canvas.addEventListener('contextmenu', (event) => event.preventDefault());

canvas.addEventListener('pointerdown', (event) => {
  canvas.setPointerCapture(event.pointerId);
  if (event.button === 1 || event.button === 2 || event.shiftKey) {
    panFrom = screenPoint(event);
    canvas.style.cursor = 'move';
    return;
  }
  const point = worldPoint(event);
  if (tool === 'circle' || tool === 'box') {
    spawnAt(point);
    spray = { point, timer: setInterval(() => spawnAt(spray.point), SPRAY_MS) };
  } else if (tool === 'grab') {
    const id = bodyAt(world, point);
    if (id !== null) {
      grab.start(id, point);
      canvas.style.cursor = 'grabbing';
    }
  } else if (tool === 'wall') {
    wallDrag = { a: point, b: point };
  }
});

canvas.addEventListener('pointermove', (event) => {
  if (panFrom) {
    const now = screenPoint(event);
    camera.pan(now.x - panFrom.x, now.y - panFrom.y);
    panFrom = now;
    autoFit = false;
    return;
  }
  const point = worldPoint(event);
  if (spray) spray.point = point;
  grab.move(point);
  if (wallDrag) wallDrag.b = point;
});

function endPointer() {
  stopSpray();
  grab.release();
  if (panFrom) panFrom = null;
  if (wallDrag) {
    const width = Math.abs(wallDrag.a.x - wallDrag.b.x);
    const height = Math.abs(wallDrag.a.y - wallDrag.b.y);
    if (width >= 8 && height >= 8) {
      addStaticBox(world, (wallDrag.a.x + wallDrag.b.x) / 2, (wallDrag.a.y + wallDrag.b.y) / 2, width, height);
    }
    wallDrag = null;
  }
  canvas.style.cursor = CURSORS[tool];
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  autoFit = false;
  camera.zoomAt(event.deltaY < 0 ? 1.1 : 1 / 1.1, screenPoint(event), viewW, viewH);
}, { passive: false });

for (const button of document.querySelectorAll('[data-tool]')) {
  button.addEventListener('click', () => { setTool(button.dataset.tool); button.blur(); });
}
for (const button of document.querySelectorAll('[data-scene]')) {
  button.addEventListener('click', () => { loadScene(Number(button.dataset.scene)); button.blur(); });
}
pauseButton.addEventListener('click', () => { setPaused(!paused); pauseButton.blur(); });
document.getElementById('step').addEventListener('click', (event) => { setPaused(true); update(FIXED_DT, true); event.currentTarget.blur(); });
document.getElementById('clear').addEventListener('click', (event) => { clearBodies(); event.currentTarget.blur(); });

function bindSlider(input, outputId, apply) {
  const output = document.getElementById(outputId);
  const sync = () => { output.textContent = input.value; apply(Number(input.value)); };
  input.addEventListener('input', sync);
  sync();
}
bindSlider(gravityInput, 'gravity-out', (value) => { gravity.y = -value; });
bindSlider(bounceInput, 'bounce-out', () => {});

window.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key.toLowerCase();
  if (SCENES[key]) loadScene(Number(key));
  else if (key === 'q') setTool('circle');
  else if (key === 'w') setTool('box');
  else if (key === 'e') setTool('grab');
  else if (key === 'r') setTool('wall');
  else if (key === ' ') { event.preventDefault(); setPaused(!paused); }
  else if (key === 'n') { setPaused(true); update(FIXED_DT, true); }
  else if (key === 'v') velocityInput.checked = !velocityInput.checked;
  else if (key === 'backspace') { event.preventDefault(); clearBodies(); }
  else if (key === 'h') { autoFit = true; camera.fit(SCENES[sceneKey].bounds, viewW, viewH); }
  else if (key === 'f') {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }
});

function drawOverlays() {
  if (grab.id !== null && world.isAlive(grab.id)) {
    const from = camera.worldToScreen(world.getComponent(grab.id, Position), viewW, viewH);
    const to = camera.worldToScreen(grab.target, viewW, viewH);
    ctx.strokeStyle = '#ffcc33';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(to.x, to.y, 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (wallDrag) {
    const a = camera.worldToScreen(wallDrag.a, viewW, viewH);
    const b = camera.worldToScreen(wallDrag.b, viewW, viewH);
    ctx.strokeStyle = '#4f9dff';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    ctx.setLineDash([]);
  }
  ctx.lineWidth = 1;
}

function updateHud(now) {
  frames++;
  if (now - fpsWindowStart >= 1000) {
    fps = Math.round((frames * 1000) / (now - fpsWindowStart));
    frames = 0;
    fpsWindowStart = now;
  }
  if (now - hudUpdated < 200) return;
  hudUpdated = now;
  const lines = [
    `${SCENES[sceneKey].name}${paused ? '  (paused)' : ''}`,
    `fps ${fps}`,
    `bodies ${dynamicCount()}/${MAX_BODIES}`,
    `entities ${entityCount()}`,
    `constraints ${solver.count()}`,
    `sim time ${simTime.toFixed(1)}s`,
  ];
  if (params.get('fps') === '0') lines.splice(1, 1);
  hud.textContent = lines.join('\n');
}

function update(dt, force = false) {
  if (paused && !force) return;
  systems.tick(dt);
  simTime += dt;
}

function render() {
  renderer.drawWorld(world, {
    width: viewW,
    height: viewH,
    showVelocity: velocityInput.checked,
    constraints: solver.list(),
  });
  drawOverlays();
  updateHud(performance.now());
}

new ResizeObserver(resize).observe(stage);
resize();

const requestedScene = Number(params.get('scene'));
loadScene(SCENES[requestedScene] ? requestedScene : 4);
setTool('circle');
const advanceSeconds = Math.min(30, Number(params.get('advance')) || 0);
for (let i = 0; i < advanceSeconds * 60; i++) update(FIXED_DT);

startGameLoop({ update, render });
