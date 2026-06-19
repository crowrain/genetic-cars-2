# Autonomous BoxCar 2D

This deployment keeps the original nginx static site on `8087` and adds two
sidecar containers:

- `genetic-cars-2-api` stores the latest population snapshot in `data/state.json`.
- `genetic-cars-2-runner` opens the site in headless Chromium with `?runner=1`
  and continuously advances generations.

Start or restart:

```sh
./start-autonomous.sh
```

Stop:

```sh
./stop-autonomous.sh
```

Useful checks:

```sh
docker logs --tail 50 genetic-cars-2-api
docker logs --tail 50 genetic-cars-2-runner
curl http://192.168.1.87:8089/health
```

Open `http://192.168.1.87:8087/` in a browser to watch the latest saved
population. The browser polls the server state and resyncs when the autonomous
runner reaches a newer generation.
