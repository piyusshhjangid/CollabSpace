# Scale, reliability, and security notes

## Durable and rebuildable state

PostgreSQL is the durable source for project state, audit records, analytics snapshots, OAuth state, integration sync jobs, and recovery jobs. Redis is used only for existing cache, realtime, and GitHub queue behavior; it can be recreated. Integration and recovery work is claimed with PostgreSQL row locks and retried with bounded delays.

The Render free demo starts the API, GitHub worker, recovery worker, and integration worker in one supervised container. A failed child process stops the service so the platform can restart a known complete unit. On the free plan the service can sleep while idle, so a queued job may wait until the next wake-up. Local Compose runs the workers as separate services.

## Failure behavior

| Failure | Expected behavior |
| --- | --- |
| PostgreSQL unavailable | /health/ready returns 503; database-backed writes fail rather than report success. |
| Redis unavailable | Realtime/cache behavior can degrade; durable integration and recovery jobs remain in PostgreSQL. Existing GitHub queue processing depends on Redis. |
| Recovery worker stops | Approved jobs remain in the database and can be reclaimed after their lock expires. |
| Integration worker stops | Sync jobs remain in PostgreSQL and can be retried after their lock expires. |
| Provider timeout or rate limit | The sync job records a safe error code and retries with bounded backoff; secrets are not included in the error message. |
| Gemini embedding API unavailable | The document is still stored and full-text search remains available. |
| pgvector unavailable | Knowledge retrieval uses PostgreSQL full-text search. |
| Scenario input becomes stale | The simulation uses a new captured snapshot; approved recovery execution rechecks task/edge state and fails closed. |
| GitHub delivery repeats | Existing delivery-ID deduplication prevents duplicate processing. |

## Tenant and action controls

All new project endpoints authenticate the user, resolve workspace membership, scope project/resource queries by the workspace ID, validate request bodies, and apply the route's permission policy. Knowledge search filters the tenant before calculating text or vector scores. Recovery execution revalidates the approver's current permission and commits the requested task/dependency edits atomically. OAuth callbacks require a single-use, expiring state token; provider credentials are encrypted at rest.

## Operational limits

- No k6/load-test report or p95 analytics latency baseline has been recorded.
- The free Render setup runs worker processes inside the web container and can pause them while idle; it is a demo topology, not independent worker scaling.
- GitHub event work uses Redis; Redis is not a durable source of record.
- Semantic retrieval performs exact scoring over workspace-scoped vectors when pgvector is present; it does not use a global ANN index. This favors tenant-bounded ranking over maximum retrieval throughput.
- /health/ready verifies PostgreSQL, not external OAuth providers, Redis, or worker liveness.
- There is no hosted metrics dashboard in this setup; request logs include request ID, route, status, and duration.

## Before a production release

1. Run the client/server build and lint checks in CI.
2. Run the tenant-isolation, RBAC, scenario determinism, recovery approval, OAuth state, and retry/idempotency suites against an isolated PostgreSQL database.
3. Record a repeatable load baseline for large projects and workspace list routes; inspect query plans before adding caches or denormalization.
4. Exercise PostgreSQL, Redis, provider, and worker failures and record observed recovery times.
5. Review deployment secrets, OAuth scopes, token rotation, backups/restore, and error logs with a second reviewer.
6. Revisit separate worker services and database pooling when measured limits justify their operational cost.
