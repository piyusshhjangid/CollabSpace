# Release Operations

## Local containers

1. Copy `.env.example` to `.env` in the repository root and replace the required local secrets.
2. Start the full application with `docker compose --profile app up --build`.
3. Open `http://localhost:8080`. The API is also reachable at `http://localhost:5000`.
4. The server container applies Prisma migrations before starting. Readiness is available at `/health/ready`.

For local development with a PostgreSQL instance outside Compose, keep using the existing `server/.env` workflow. Start only Redis with `docker compose up -d redis`.

To run invitation email processing in containers, configure SMTP in the root `.env` file and use `docker compose --profile app --profile email up --build`. Without SMTP, token invitations remain available and the email worker should not be started.

## Production checklist

- Use a managed PostgreSQL service with backups and TLS. Set `DATABASE_URL` only in the host secret manager.
- Use Redis with persistence, authentication, network access controls and monitoring.
- Set a high-entropy `JWT_SECRET`, production `CLIENT_ORIGIN`, `APP_BASE_URL`, and `TRUST_PROXY=true` only behind a trusted one-hop proxy.
- Configure GitHub webhook secret and AI provider key in the secret manager; do not put either in a Docker build argument.
- Use HTTPS, a restricted CORS origin, log retention, database backups, worker monitoring, and a rollback plan.
- Run schema migration, API, web client, GitHub worker, and optional email worker as separately observable services.
- Configure DNS, TLS and an external hosting account before claiming a public release. This repository does not contain a live public URL or shared demo credentials.

## CI behavior

GitHub Actions runs `npm ci`, Prisma client generation and server compilation. It runs client lint and production build. Database-backed tests, provider credentials, and end-to-end deployment are intentionally separate environment-dependent release gates.
