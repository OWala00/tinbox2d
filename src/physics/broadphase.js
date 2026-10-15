// uniform spatial hash grid. each AABB gets inserted into every cell it
// touches, so a body straddling a cell boundary is still found by whatever
// is in the neighboring cell. query() returns deduped candidate pairs —
// actual narrow-phase testing happens elsewhere.
export function createSpatialGrid(cellSize = 64) {
  function cellKey(cx, cy) {
    return `${cx},${cy}`;
  }

  function cellsForAabb(aabb) {
    const minCx = Math.floor(aabb.minX / cellSize);
    const minCy = Math.floor(aabb.minY / cellSize);
    const maxCx = Math.floor(aabb.maxX / cellSize);
    const maxCy = Math.floor(aabb.maxY / cellSize);
    const cells = [];
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        cells.push(cellKey(cx, cy));
      }
    }
    return cells;
  }

  // entries: array of { id, aabb }. rebuilt fresh each call, this is a
  // broad-phase for a single frame, not a persistent structure.
  function query(entries) {
    const buckets = new Map();
    for (const entry of entries) {
      for (const key of cellsForAabb(entry.aabb)) {
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(entry.id);
      }
    }

    const seen = new Set();
    const pairs = [];
    for (const ids of buckets.values()) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = ids[i];
          const b = ids[j];
          const pairKey = a < b ? `${a}:${b}` : `${b}:${a}`;
          if (seen.has(pairKey)) continue;
          seen.add(pairKey);
          pairs.push(a < b ? [a, b] : [b, a]);
        }
      }
    }
    return pairs;
  }

  return { query };
}
