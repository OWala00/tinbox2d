// entities are just integers. no class, no hidden state beyond this closure.
export function createWorld() {
  let nextId = 0;
  const freeIds = [];
  const alive = new Set();

  function createEntity() {
    const id = freeIds.length > 0 ? freeIds.pop() : nextId++;
    alive.add(id);
    return id;
  }

  function destroyEntity(id) {
    if (!alive.has(id)) return;
    alive.delete(id);
    freeIds.push(id);
  }

  function isAlive(id) {
    return alive.has(id);
  }

  return { createEntity, destroyEntity, isAlive };
}
