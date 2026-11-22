import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCamera } from '../src/render/camera.js';

test('the camera center maps to the middle of the view', () => {
  const camera = createCamera({ x: 10, y: 20, zoom: 2 });
  assert.deepEqual(camera.worldToScreen({ x: 10, y: 20 }, 800, 600), { x: 400, y: 300 });
});

test('world y-up becomes screen y-down', () => {
  const camera = createCamera();
  const up = camera.worldToScreen({ x: 0, y: 50 }, 800, 600);
  const origin = camera.worldToScreen({ x: 0, y: 0 }, 800, 600);
  assert.ok(up.y < origin.y);
});

test('screenToWorld inverts worldToScreen', () => {
  const camera = createCamera({ x: -5, y: 7, zoom: 3.5 });
  const p = { x: 42, y: -13 };
  const back = camera.screenToWorld(camera.worldToScreen(p, 640, 480), 640, 480);
  assert.ok(Math.abs(back.x - p.x) < 1e-9);
  assert.ok(Math.abs(back.y - p.y) < 1e-9);
});

test('zooming at a screen point keeps the world point under the cursor fixed', () => {
  const camera = createCamera({ zoom: 1 });
  const cursor = { x: 100, y: 80 };
  const before = camera.screenToWorld(cursor, 800, 600);
  camera.zoomAt(2, cursor, 800, 600);
  const after = camera.screenToWorld(cursor, 800, 600);
  assert.ok(Math.abs(before.x - after.x) < 1e-9);
  assert.ok(Math.abs(before.y - after.y) < 1e-9);
  assert.equal(camera.zoom, 2);
});

test('fit shows the whole bounds inside the view', () => {
  const camera = createCamera();
  const bounds = { minX: -300, minY: -200, maxX: 300, maxY: 200 };
  camera.fit(bounds, 800, 600);
  const topLeft = camera.worldToScreen({ x: bounds.minX, y: bounds.maxY }, 800, 600);
  const bottomRight = camera.worldToScreen({ x: bounds.maxX, y: bounds.minY }, 800, 600);
  assert.ok(topLeft.x >= 0 && topLeft.y >= 0);
  assert.ok(bottomRight.x <= 800 && bottomRight.y <= 600);
});
