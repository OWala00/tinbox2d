# tinbox2d

A small 2D physics engine in plain JavaScript. Try it here: https://tinbox2d.netlify.app

![sandbox scene](docs/sandbox.png)

You can drop circles and boxes, grab and throw them, draw walls, and change gravity and bounce while it runs. There are three preset scenes too:

<img src="docs/balls.png" width="32%" alt="balls"> <img src="docs/pyramid.png" width="32%" alt="pyramid"> <img src="docs/pendulum.png" width="32%" alt="pendulum">

Bodies are circles and axis-aligned boxes, so nothing rotates yet. Collisions use a spatial hash to find nearby pairs and impulses with friction to push them apart. The pendulum is a distance constraint.

## Running

It uses ES modules, so serve the folder instead of opening the file directly:

```
python3 -m http.server 8000
```

Then go to http://localhost:8000.

## Controls

Pick a tool from the toolbar (or press Q, W, E, R) and click in the scene. Right-drag pans and the wheel zooms. Space pauses, N steps once, Backspace clears the bodies, and 1-4 switch scenes.

## Grandma's demands

Three small pages built from a list of demands. They live in `grandma/` and don't touch the sandbox.

- `grandma/no-js/`: HTML and CSS only, no script.
- `grandma/routes/`: rooms switch with the History API, so moving between them doesn't reload the page.
- `grandma/db/`: a filing cabinet with records kept in the browser's IndexedDB.

Run them with the included server, which also answers direct links such as `/grandma/routes/kitchen`:

```
node grandma/serve.js
```

Then go to http://localhost:8001/grandma/.

## Tests

```
npm test
```
