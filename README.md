# tinbox2d

A 2D physics engine written from scratch in plain JavaScript. No framework, no build step, no dependencies. Live demo: https://tinbox2d.netlify.app

![Boxes and circles resting on platforms in the sandbox scene](docs/sandbox.png)

The demo is a sandbox. Drop circles and boxes, grab one and throw it, draw walls, and change gravity and bounciness while it runs.

| Balls | Pyramid | Pendulum |
| --- | --- | --- |
| ![Twenty balls resting on the floor](docs/balls.png) | ![A pyramid of boxes](docs/pyramid.png) | ![A pendulum bob hanging from a rod](docs/pendulum.png) |

## How it works

Entities are plain integer ids, and their data (position, velocity, shape, mass, material) lives in per-type stores. Systems are functions that run in the order you register them.

Each tick moves bodies with semi-implicit Euler, finds candidate pairs with a spatial hash grid, tests circles and axis-aligned boxes, then resolves contacts with impulses, friction and a small position correction. The collision pass repeats a few times per tick so stacks settle instead of sinking. Rods are distance constraints. Grabbing a body steers its velocity instead of teleporting it, so it still collides on the way and keeps its speed when you let go.

Bodies don't rotate yet. Spring and hinge joints aren't built.

## Running

The page loads ES modules, so it needs to be served rather than opened from disk:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Controls

| Input | Action |
| --- | --- |
| Click or hold (Circle / Box tool) | Drop bodies at the cursor |
| Grab tool | Drag a body, release to throw it |
| Wall tool | Drag out a rectangle to make a static wall |
| Right-drag or Shift-drag | Pan |
| Mouse wheel | Zoom |
| `Q` `W` `E` `R` | Circle, Box, Grab, Wall |
| `1` `2` `3` `4` | Balls, Pyramid, Pendulum, Sandbox |
| `Space` / `N` | Pause / single step |
| `Backspace` | Remove all movable bodies |
| `V` / `H` / `F` | Velocity vectors / reset view / fullscreen |

`?scene=1..4` picks a scene and `?advance=<seconds>` simulates that long before the first frame. The screenshots above were taken that way.

## Layout

```
src/
  math/     vectors and AABBs
  ecs/      entity and component storage, system runner
  physics/  integration, collision detection and response, constraints, grab
  render/   camera and canvas drawing
  core/     fixed-timestep loop
demo/       scenes and the page entry point
docs/       screenshots
test/       unit tests (node:test)
```

## Tests

```bash
npm test
```
