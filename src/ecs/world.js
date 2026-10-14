// entities are just integers. no class, no hidden state beyond this closure.
// components are stored per-type in a Map<entityId, data>, keyed by the
// component factory function itself (see components.js).
export function createWorld() {
  let nextId = 0;
  const freeIds = [];
  const alive = new Set();
  const stores = new Map();

  function createEntity() {
    const id = freeIds.length > 0 ? freeIds.pop() : nextId++;
    alive.add(id);
    return id;
  }

  function destroyEntity(id) {
    if (!alive.has(id)) return;
    alive.delete(id);
    freeIds.push(id);
    for (const store of stores.values()) {
      store.delete(id);
    }
  }

  function isAlive(id) {
    return alive.has(id);
  }

  function storeFor(type) {
    let store = stores.get(type);
    if (!store) {
      store = new Map();
      stores.set(type, store);
    }
    return store;
  }

  function addComponent(id, type, data) {
    storeFor(type).set(id, data);
  }

  function getComponent(id, type) {
    const store = stores.get(type);
    return store ? store.get(id) : undefined;
  }

  function removeComponent(id, type) {
    const store = stores.get(type);
    if (store) store.delete(id);
  }

  function hasComponent(id, type) {
    const store = stores.get(type);
    return store ? store.has(id) : false;
  }

  return {
    createEntity,
    destroyEntity,
    isAlive,
    addComponent,
    getComponent,
    removeComponent,
    hasComponent,
  };
}
