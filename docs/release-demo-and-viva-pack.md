# Release demo and architecture walkthrough

## Two-minute product story

CollabSpace helps a team define a delivery outcome, model its work as tasks and dependencies, and compare planned work with observed updates. The execution graph and delivery-health views explain risk from stored project data. What-if simulations are deterministic and never change production tasks. Recovery changes require a second workspace member's approval, then the worker rechecks and verifies them. Knowledge search returns source passages; external providers contribute read-only issue/pipeline activity or an explicitly requested Slack digest.

The current agent roles are deterministic read-only analyses. They do not call an LLM or make changes.

## Five-minute product demo

1. Open a workspace and project with a few tasks and a dependency chain.
2. Show the Execution graph and a live task status change.
3. Open Insights and explain the critical path, slack, blocked/cycle time, and a bottleneck.
4. Create a what-if delay scenario, run it, and compare the finish date with baseline.
5. Generate a recovery review. Select an option and show that a different member must approve it.
6. Show an agent trace with cited task IDs and its saved work budget.
7. Add a short knowledge document, search it, and inspect the source passage citation.
8. If provider credentials are configured, show a sync queued, its activity, and a Slack digest action.

## Fifteen-minute architecture defense

### Request and tenant boundary

The client sends an authenticated request. Middleware identifies the user and resolves the selected workspace. Service and repository paths scope project, document, job, and integration queries with that workspace. The browser cannot grant itself access by changing an ID.

### Execution and truth

PostgreSQL stores declared task state, dependency edges, status history, evidence, integration activity, and immutable snapshots. Deterministic services compute graph metrics and forecasts from that state. The API's saved state remains the source of truth.

### Scenarios and recovery

The scenario engine copies its input graph, applies changes to the copy, validates acyclicity, and captures a deterministic result. Recovery candidates are simulations; they are not changes. A distinct approver authorizes a specific option. The worker rechecks current role and project/task state, applies changes atomically, records verification, and retries bounded failures.

### Agents and knowledge

Agent roles are bounded deterministic analyses with stored traces, citations, budgets, and a grounding evaluation. Knowledge passages are filtered by workspace before ranking. Gemini embeddings are optional and require a separate configured API key plus pgvector. Today the product does not generate answers from retrieved text.

### Integration delivery

OAuth state is hashed, one-use, and expiring. Provider credentials are encrypted at rest. Sync jobs use a PostgreSQL outbox; provider events are deduplicated. Jira, Linear, and GitLab imports are read-only; Slack is only used to send the selected digest.

### Scaling and tradeoffs

The current deployment is a modular monolith. PostgreSQL is durable; Redis is rebuildable. The Render free demo starts workers in the same container and can sleep while idle. There is no measured load baseline yet, so database indexes, pooling, and separate workers should be changed only after a repeatable profile identifies the limit.

## Self-assessment evidence

Use this as a discussion checklist, not as a claim that each external setup or validation is complete:

| Area | Current evidence | Remaining evidence |
| --- | --- | --- |
| Product | Workspaces, projects, tasks, outcomes, execution graph, delivery health, Insights | Walk through the end-to-end project flow on a seeded workspace |
| Backend | Layered Express services, request validation, durable workers | Run CI builds and review logs from a full workflow |
| Database | PostgreSQL/Prisma schema, workspace scoping, durable outbox tables | Apply the new migration to a clean database and verify migration status |
| Security | RBAC, workspace checks, one-use OAuth state, encrypted provider tokens, second-person recovery approval | Run the tenant/RBAC/security suites and independent review |
| AI | Deterministic agent runs and optional embedding retrieval | No generative agent or model-quality evaluation suite is implemented |
| Simulation | Saved immutable what-if runs with DAG validation | Run deterministic fixtures and compare captured outcomes |
| Reliability | Retryable PostgreSQL job tables and supervised demo workers | Exercise worker/database/provider failures and record recovery |
| Scale | Workspace and project scoped queries | Record load and query-plan baselines; p95 is not measured |
| Deployment | Render free Blueprint and Docker build configuration | Deploy and verify the live URL and background processing |
| Documentation | Architecture, safety, integration, and operations notes | Capture a demo video and fill in measured scorecard evidence |

## Release gate

Before sharing a live demo, apply migrations, set persistent JWT and integration encryption secrets, configure only the OAuth apps being demonstrated, run client/server build and lint in CI, exercise registration and workspace access, run all required security and scenario checks, verify the free service wakes and resumes workers, and keep database backup/expiry limitations visible to the operator.
