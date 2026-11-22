# Architecture decisions

These decisions describe the current implementation and its tradeoffs.

## ADR 001 — Modular monolith

**Decision:** Keep the API and product modules in one TypeScript/Express application; run durable worker loops as separate processes where the host supports them.

**Reason:** The product has one owner and one transactional database. A modular monolith keeps tenant checks and atomic updates straightforward while route, service, and repository boundaries remain explicit.

**Revisit when:** A worker needs independent scaling, deployment ownership, or a fault boundary that a separate process in the same service cannot provide.

## ADR 002 — PostgreSQL owns durable truth

**Decision:** Store workspaces, tasks, execution state, audit records, integration state, and durable jobs in PostgreSQL. Redis is for existing ephemeral queues, caching, and realtime fan-out; it is rebuildable.

**Reason:** Project changes, approvals, and queue state need transactions and constraints. Redis loss must not erase the durable recovery or integration outbox.

## ADR 003 — Workspace scope is derived on the server

**Decision:** Every new knowledge, analytics, scenario, recovery, agent, and integration path resolves the authenticated user's workspace membership and scopes its project/document/resource queries by workspace.

**Reason:** A client-supplied identifier is not proof of access. Tenant filters are applied before search scoring.

## ADR 004 — Deterministic engines precede AI

**Decision:** Graph analytics, simulation, and recovery candidates are computed with explicit rules. Current agents are deterministic read-only analyses.

**Reason:** Dates, task status, and permission decisions need a reproducible source of truth. A model must never become authoritative for those values.

## ADR 005 — Scenarios are immutable snapshots

**Decision:** A scenario run stores its source version, task/edge snapshot, changes, capture time, and result. It never writes task or dependency state.

**Reason:** The user can compare a hypothetical plan without risking production data; the persisted snapshot makes a run inspectable and replayable.

## ADR 006 — Webhook and provider work is acknowledged before processing

**Decision:** Verify and persist inbound GitHub delivery data before asynchronous processing. Queue outbound provider sync in a PostgreSQL outbox, deduplicate events, and retry with bounds.

**Reason:** External requests can repeat, arrive out of order, time out, or outlive a worker process.

## ADR 007 — Approved actions are executed as the caller

**Decision:** An action stores a structured plan, requires a distinct workspace approver, rechecks permission and state at execution, applies atomically, verifies, and records an audit event.

**Reason:** An analysis role or agent must not elevate its authority, silently overwrite a changed task, or act on stale approvals.
