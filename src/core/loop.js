// physics always advances in equal fixed steps; rendering happens once per
// frame with whatever fraction of a step is left in the accumulator.
export function createStepper(step, { hz = 60, maxSteps = 5 } = {}) {
  const dt = 1 / hz;
  let accumulator = 0;

  return {
    advance(frameSeconds) {
      accumulator += Math.min(frameSeconds, maxSteps * dt);
      let steps = 0;
      while (accumulator >= dt - 1e-9) {
        step(dt);
        accumulator -= dt;
        steps++;
      }
      return steps;
    },
    alpha() {
      return accumulator / dt;
    },
  };
}

export function startGameLoop({
  update,
  render,
  hz = 60,
  now = () => performance.now() / 1000,
  raf = (cb) => requestAnimationFrame(cb),
}) {
  const stepper = createStepper(update, { hz });
  let last = now();
  let running = true;

  function frame() {
    if (!running) return;
    const t = now();
    stepper.advance(t - last);
    last = t;
    render(stepper.alpha());
    raf(frame);
  }

  raf(frame);
  return { stop: () => { running = false; } };
}
