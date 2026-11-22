# Execution intelligence

CollabSpace computes execution metrics from PostgreSQL task, dependency, status-history, and saved-plan data. These calculations are deterministic and do not write project state.

## Analytics

The project Insights page reports:

- critical path, estimated graph duration, and task slack;
- dependency fan-in/fan-out and a reachability-based centrality signal;
- overdue and blocked tasks;
- cycle-time and blocked-time percentiles from task status history;
- open task workload by assignee; and
- plan-to-actual variance when a task has both a saved planned end date and completion time.

Cycle time is measured from the first recorded `IN_PROGRESS` transition to the first recorded `DONE` transition. If no start transition exists, task creation is used as the fallback. Percentiles use the nearest-rank definition. The centrality score is an execution graph signal, not a probability of failure. The workload chart counts open work and saved task durations; it does not treat hours or capacity as ground truth.

Analytics snapshots preserve the metric result and its capture time. They are append-only so a later plan change does not overwrite the view of an earlier plan.

## What-if scenarios

The simulator supports:

- adding a delay to selected tasks;
- modeling unavailable assignees and a duration penalty;
- reassigning selected open tasks for workload comparison;
- excluding task scope, optionally with downstream dependents;
- adding or removing dependency edges, with cycle validation; and
- changing or removing the delivery deadline.

Each run captures the project tasks, edges, baseline version, deadline, changes, and simulation time. The simulator operates on copies and never mutates tasks or dependencies. Re-running identical inputs at a different date creates a new snapshot. A matching input within the same capture instant is deduplicated.

The current capacity model adds the configured unavailable time to each assigned task. It does not model skill fit, partial availability, or true resource-constrained scheduling. Dates are planning estimates, not delivery commitments.

## Recovery

Recovery plans derive candidates from current delivery risks and rerun each candidate through the deterministic simulator. A recovery plan is stored with its evidence, options, and selected option. A plan cannot change project data until a different workspace member approves it.

The worker rechecks the approver's current workspace role, project/task scope, expected task state, and dependency graph before applying the approved action. Changes and verification are committed atomically. A stale plan fails closed and must be regenerated. Jobs retry with backoff and stop after five attempts.

Recovery currently supports safe dependency relaxation and workload reassignment candidates. It does not automatically delete scope, edit external systems, or execute arbitrary text instructions.

## Current limits

- A cycle in the project graph prevents analytics and simulation; the API returns a clear validation error.
- Historical percentiles need enough recorded status transitions to be meaningful.
- Plan accuracy requires a saved plan end date and a completion timestamp.
- No load-test baseline has been recorded for these metrics yet.
