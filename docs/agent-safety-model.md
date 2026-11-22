# Agent safety model

## Current behavior

Project agents are deterministic analysis roles: Planner, Evidence, Risk, Forecast, Recovery, Execution, and Coordinator. The Coordinator composes a set of the same bounded roles. These runs do not call an LLM, do not execute tools, and cannot change tasks, graph edges, or integrations.

Each run stores:

- workspace, project, and requesting user identifiers;
- the requested role, question, and work budget;
- the result, ordered role steps, and task citations;
- an evaluation record with citation and budget metrics; and
- an idempotency key scoped to workspace and user.

The run endpoint requires workspace membership and verifies project scope on the server. Reuse of an idempotency key with different input is rejected. A canonical input comparison makes retries return the saved result.

## Action boundary

Any proposed execution change must pass these gates:

1. Derive the caller from the authenticated session.
2. Resolve workspace and project membership on the server.
3. Validate the action against a strict request schema.
4. Check the caller's current workspace permission.
5. Store a named plan and the exact proposed changes.
6. Require a different workspace member to approve.
7. Recheck the approver, task state, and graph at execution time.
8. Apply atomically, verify postconditions, and audit the result.

The current recovery flow implements this boundary. Agent analysis cannot grant itself additional authority or bypass the review path.

## Knowledge safety

Knowledge search returns source passages with document and section identifiers. It does not produce an AI answer. Document text is untrusted data and must not be interpreted as system instructions. Search filters by authenticated workspace before scoring.

## What is not implemented

- These roles are not autonomous LLM agents.
- There is no tool-calling loop or model-generated action proposal.
- The stored evaluation is a small deterministic grounding check, not a broad golden-set quality evaluation.
- Human approval, conflict handling, and audit data should remain mandatory if model reasoning is added later.

When adding an LLM provider, require structured output, cite the exact task/evidence/document IDs used, reject unsupported citations, track latency and provider errors, and keep the current deterministic services authoritative for dates, status, permissions, and execution.
