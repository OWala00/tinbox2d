# tinbox2d

A small 2D physics engine, built from scratch. No framework, no build step — plain ES modules you can open directly in a browser.

## Status

Early. Right now this is just the project skeleton. See the folder layout below for where things will land as they get built.

## Layout

```
src/
  math/     vector and AABB math
  ecs/      entity/component storage and system runner
  physics/  integration, collision detection, collision response
  render/   canvas drawing
  core/     the game loop
demo/       runnable demo pages
test/       unit tests (node:test)
```

## Running

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Tests

```bash
npm test
```

## License

MIT
