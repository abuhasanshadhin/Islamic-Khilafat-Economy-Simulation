# Banking Simulator

## Local Docker Development

Use the development compose file when you want live code updates inside containers.

Start the dev stack:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Run it in the background:

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

Restart just the app containers after code or config changes:

```bash
docker compose -f docker-compose.dev.yml up -d --build frontend backend
```

Important:

- `docker compose up` uses `docker-compose.yml`, which is the production-style setup.
- `docker-compose.yml` bakes code into images, so file edits will not hot-reload there.
- `docker-compose.dev.yml` mounts `./frontend` and `./backend` into the containers and is the file you want for local development.