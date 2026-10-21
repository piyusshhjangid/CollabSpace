# Execution model (Days 49–52)

## Outcome hierarchy

An `Outcome` belongs to one workspace and states the measurable result, success criteria, owner, and target date. `Goal` rows break an outcome into smaller results; `Milestone` rows provide dated checkpoints under a goal. A project can be linked to an outcome. Existing projects remain unlinked until a workspace member chooses an outcome.

Every read and write resolves workspace membership first. Nested resources are looked up with both their own id and the resolved workspace id. A client supplied workspace id is only a route selector; it does not grant access. Members may manage outcomes and dependencies, while viewers are read-only.

## Delivery contract and plan baselines

Contracts and execution plans are append-only versioned records. Updating a baseline means creating the next version; the prior version remains available for comparison. Contract versions store scope, deadline, constraints, owner, and acceptance criteria. Plan versions store planned start/end dates, duration, order, and the contract version they were based on. Plan tasks must belong to projects linked to that outcome and to the same workspace.

Version creation is serialized per outcome with a PostgreSQL transaction-scoped advisory lock, then protected by a unique `(outcome_id, version)` constraint. Database checks prevent invalid planned date ranges and non-positive durations.

## Dependency graph

`task_dependencies` stores directed edges within a workspace and project. The write path validates both endpoints in the same project/workspace, rejects self edges, checks whether the proposed successor already reaches the proposed predecessor, and only then inserts the edge. This preserves the DAG invariant at write time. The unique predecessor/successor key also makes duplicate links fail cleanly.

Pure graph algorithms live in `server/src/lib/graph`: adjacency construction, ancestor/descendant traversal, Kahn topological sorting with cycle reporting, and critical path/slack calculation. Database access stays outside this module so fixtures can exercise the algorithms deterministically.

## API

- `GET/POST /api/workspaces/:workspaceId/outcomes`
- `PATCH/DELETE /api/workspaces/:workspaceId/outcomes/:outcomeId`
- `POST /api/workspaces/:workspaceId/outcomes/:outcomeId/goals`
- `PATCH/DELETE /api/workspaces/:workspaceId/goals/:goalId`
- `POST /api/workspaces/:workspaceId/goals/:goalId/milestones`
- `PATCH/DELETE /api/workspaces/:workspaceId/milestones/:milestoneId`
- `POST /api/workspaces/:workspaceId/outcomes/:outcomeId/contracts`
- `POST /api/workspaces/:workspaceId/outcomes/:outcomeId/plans`
- `PATCH /api/workspaces/:workspaceId/projects/:projectId/outcome`
- `GET /api/projects/:projectId/graph?workspaceId=...`
- `POST/DELETE /api/projects/:projectId/dependencies?workspaceId=...`

All request bodies are schema-validated and all endpoints use the existing authentication, workspace-context, and permission middleware.
