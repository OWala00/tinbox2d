// world space is y-up; screen space is y-down, so the camera flips y.
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 20;

export function createCamera({ x = 0, y = 0, zoom = 1 } = {}) {
  const camera = {
    x,
    y,
    zoom,

    worldToScreen(p, viewW, viewH) {
      return {
        x: (p.x - camera.x) * camera.zoom + viewW / 2,
        y: viewH / 2 - (p.y - camera.y) * camera.zoom,
      };
    },

    screenToWorld(p, viewW, viewH) {
      return {
        x: (p.x - viewW / 2) / camera.zoom + camera.x,
        y: (viewH / 2 - p.y) / camera.zoom + camera.y,
      };
    },

    pan(dxScreen, dyScreen) {
      camera.x -= dxScreen / camera.zoom;
      camera.y += dyScreen / camera.zoom;
    },

    zoomAt(factor, screenPoint, viewW, viewH) {
      const before = camera.screenToWorld(screenPoint, viewW, viewH);
      camera.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.zoom * factor));
      const after = camera.screenToWorld(screenPoint, viewW, viewH);
      camera.x += before.x - after.x;
      camera.y += before.y - after.y;
    },

    fit(bounds, viewW, viewH, margin = 0.9) {
      const width = bounds.maxX - bounds.minX;
      const height = bounds.maxY - bounds.minY;
      camera.zoom = Math.min(viewW / width, viewH / height) * margin;
      camera.x = (bounds.minX + bounds.maxX) / 2;
      camera.y = (bounds.minY + bounds.maxY) / 2;
    },
  };
  return camera;
}
