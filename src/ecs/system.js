// systems are just plain functions: (world, dt) => void. they run in the
// order they were registered, nothing clever, no scheduling.
export function attachSystems(world) {
  const systems = [];

  function registerSystem(fn) {
    systems.push(fn);
  }

  function tick(dt) {
    for (const system of systems) {
      system(world, dt);
    }
  }

  function query(...types) {
    const result = [];
    for (const id of world.entities()) {
      if (types.every((type) => world.hasComponent(id, type))) {
        result.push(id);
      }
    }
    return result;
  }

  return { registerSystem, tick, query };
}
