# Delivery Intelligence

CollabSpace keeps declared task status separate from observed delivery signals. PostgreSQL is the source of truth for tasks, integration events, evidence and reconciliation output. External evidence is append-only; the reconciled truth record is derived and can be recomputed.

## GitHub evidence ingestion

1. An owner or admin connects a GitHub repository to a project from **Delivery Health**.
2. Configure a GitHub webhook to `POST /integrations/github` with JSON content type and the same value as `GITHUB_WEBHOOK_SECRET`.
3. Subscribe to `push`, `pull_request`, `pull_request_review`, `check_run`, `workflow_run`, `issues` and `deployment_status`.
4. Run `npm run worker:github` from `server` with PostgreSQL and Redis available.

The API verifies `X-Hub-Signature-256` against the unmodified request bytes with a constant-time comparison, stores each `X-GitHub-Delivery` once, and acknowledges after queueing. The worker normalizes supported event types, stores a curated event record, links a task only when its `CS-...` key or UUID appears in branch/title/body/commit text, and adds evidence with explicit confidence. Raw webhook payloads are cleared from PostgreSQL after successful processing. Events without a task reference remain visible in the project timeline but do not affect task truth.

`GITHUB_WEBHOOK_SECRET` is configured once per API deployment; repository secrets are not saved in CollabSpace. For separate secret rotation per repository or GitHub App installation-token operations, deploy an integration gateway with encrypted per-installation credentials before adopting that model.

## Truth and evidence

Evidence records include source, event, capture time, observed signal, confidence, explanation and provenance. They are immutable through the API. Reconciliation weights evidence by source and age, explains competing signals, and writes a derived `task_truth` row. A workspace-wide pass runs every 15 minutes in the GitHub worker; an authenticated workspace member can also request reconciliation.

The weights are deterministic product heuristics, not statistical guarantees. A merged pull request alone does not assert a production deployment. The UI displays disagreement between the current task status and external observations.

## Forecast and drift

Forecasts use task status, recent completions, dependency critical path and the latest saved execution-plan baseline. P50 and P85 are approximate planning ranges; the response includes the sample count, velocity, confidence label and fallback explanation. Risk factors identify blocked, overdue, waiting and stale work. Missing completion history yields a low-confidence fallback and is surfaced as a risk.

## Grounded analysis and approvals

AI analysis receives bounded, structured task, evidence, forecast and health data. User and integration text is treated as untrusted data. The model has no direct tools and cannot change the system's deterministic state. Output must satisfy a response schema; only existing project evidence IDs are kept as citations. Requests are rate limited, time bounded and audited. `GEMINI_API_KEY` is optional; without it, analysis returns a configuration error while non-AI features continue to work.

Task recommendations can be saved as proposals. A workspace member must explicitly approve or reject each proposal. Approval uses the caller's authenticated identity and task-creation permission, atomically records the decision and task, then invalidates the summary cache and publishes a realtime event. There is no model-side approval bypass.

## Operations

- `GET /health/live` reports process liveness.
- `GET /health/ready` checks PostgreSQL and returns `503` when the database is unavailable.
- Redis is optional for existing summary/auth fallbacks, but durable webhook processing and cross-instance fanout require Redis.
- The CI workflow builds and lints the client and compiles the server. It does not provision databases, credentials, or a public hosting account.
