HTML5 Genetic Cars
==================

A genetic algorithm car evolver in HTML5 canvas.

Inspired by BoxCar2D, uses the same physics engine (Box2D), written from scratch.

Originally published on http://rednuht.org/genetic_cars_2/

## Running

Just open `index.html` in a browser. No build step, no npm, no bundler.

For the graph-only (headless) view, open `graphs.html`.

> **Tip:** Some browsers block local file access. If needed, serve locally:
> ```
> python3 -m http.server 8000
> ```
> Then visit `http://localhost:8000`

## Autonomous Server Mode

This fork can run continuously on a server while a browser watches the latest
saved population.

```sh
./start-autonomous.sh
```

The script starts two sidecar containers:

- `genetic-cars-2-api` stores the latest compact population snapshot in
  `data/state.json`.
- `genetic-cars-2-runner` opens the simulation in headless Chromium with
  `?runner=1` and keeps evolving cars.

Stop it with:

```sh
./stop-autonomous.sh
```

See `README_AUTONOMOUS.md` for deployment details.
