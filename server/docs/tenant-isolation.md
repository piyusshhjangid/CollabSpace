# Tenant Isolation & Security Test Suite

## Purpose

Day 47 adds an automated security harness proving that one authenticated user
cannot access, modify, or delete resources belonging to another workspace.

The authoritative authorization chain is:

Request
? requireAuth
? workspaceContext
? workspace membership lookup
? role validation
? resource/workspace validation
? repository query

## Authentication boundary

Access tokens contain only the authenticated user's ID in the `sub` claim.

`requireAuth` verifies the JWT signature and expiration and assigns:

`req.user.id = decoded.sub`

Workspace membership is not trusted from the JWT.

## Workspace boundary

`workspaceContext` takes the workspace ID from:

- `req.params.workspaceId`
- or `req.query.workspaceId`

It then verifies that the authenticated user has membership in that workspace.

A missing membership produces a forbidden response.

This prevents User A from using User B's workspace ID against workspace-scoped
routes.

## Resource boundary

Workspace membership alone is not sufficient for resources.

Project-dependent endpoints must also verify:

`project.id == requested projectId`
and
`project.workspace_id == requested workspaceId`

Task-dependent endpoints must preserve:

`task.project_id == requested projectId`
and
`task.workspace_id == requested workspaceId`

This prevents mixed-identifier attacks such as:

`Project B + Workspace A`

## Tested routes

The attack suite covers:

- `GET /api/workspaces/:workspaceId/me`
- `DELETE /api/workspaces/:workspaceId/members/:userId`
- `DELETE /api/workspaces/:workspaceId`
- `GET /api/workspaces/:workspaceId/projects`
- `POST /api/workspaces/:workspaceId/projects`
- `DELETE /api/workspaces/:workspaceId/projects/:projectId`
- `GET /api/projects/:projectId/summary`
- `GET /api/projects/:projectId/tasks`
- `POST /api/projects/:projectId/tasks`
- `PATCH /api/projects/:projectId/tasks/:taskId`
- `POST /api/workspaces/:workspaceId/invitations`

## IDOR coverage

The test suite specifically attempts to use:

- a Project B ID with Workspace A
- a Task B ID with Workspace A
- a Project B ID inside a Workspace A task-creation request
- a Project B deletion request using Workspace A context
- a Task B update using Workspace A context

Cross-tenant requests must never result in a successful resource operation.

Expected failure statuses are:

`400`, `401`, `403`, or `404`

A `500` is considered a security/integrity test failure because an invalid
tenant request must be handled as a controlled application error.

## Database integrity checks

The suite verifies that rejected cross-tenant task creation does not create a
task.

It also verifies that a rejected cross-tenant task update leaves the target
task unchanged.

## Token security

The suite covers:

- expired access token ? `401`
- tampered access token ? `401`
- expired refresh token ? `401`
- revoked refresh token ? `401`
- valid refresh token ? successful refresh
- refresh-token replay ? `401`
- refresh after logout ? `401`

Refresh tokens are single-use.

A successful refresh atomically revokes the consumed token and creates a new
refresh token. Concurrent reuse of the old token cannot produce two successful
refreshes.

## Test database

Tests run against:

`collabspace_test`

The test setup refuses to run against a non-local database or the normal
`collabspace` database.

Test data is cleared before every test.

The development database is therefore never used for test data.

## Reproducing the test environment

First create/recreate the dedicated database:

`node .\scripts\recreate-test-db.mjs`

Then synchronize the disposable database with the Prisma schema:

`$env:DATABASE_URL = <test database URL>`

`npx prisma db push --accept-data-loss`

The repository test setup derives the test database connection from the local
development connection without exposing credentials.

## Verification

Run:

`npm test`

Run:

`npx tsc --noEmit`

The complete Day 47 security suite must pass before the Day 47 commit.
