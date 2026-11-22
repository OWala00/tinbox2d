import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStepper } from '../src/core/loop.js';

test('one second of frame time at 60 Hz runs 60 fixed steps', () => {
  let calls = 0;
  const stepper = createStepper(() => calls++, { hz: 60, maxSteps: 60 });
  const steps = stepper.advance(1);
  assert.equal(steps, 60);
  assert.equal(calls, 60);
});

test('every step is exactly 1/hz seconds', () => {
  const dts = [];
  const stepper = createStepper((dt) => dts.push(dt), { hz: 60 });
  stepper.advance(0.5);
  for (const dt of dts) assert.ok(Math.abs(dt - 1 / 60) < 1e-12);
});

test('leftover time carries into the next frame instead of being dropped', () => {
  let calls = 0;
  const stepper = createStepper(() => calls++, { hz: 60 });
  stepper.advance(0.01);
  assert.equal(calls, 0);
  stepper.advance(0.01);
  assert.equal(calls, 1);
});

test('a huge frame gap is clamped so the loop cannot spiral', () => {
  let calls = 0;
  const stepper = createStepper(() => calls++, { hz: 60, maxSteps: 5 });
  stepper.advance(10);
  assert.equal(calls, 5);
});

test('alpha reports the fraction of a step left over for rendering', () => {
  const stepper = createStepper(() => {}, { hz: 60 });
  stepper.advance(1 / 120);
  assert.ok(Math.abs(stepper.alpha() - 0.5) < 1e-9);
});
