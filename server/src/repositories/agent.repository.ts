import { prisma } from "../db/prisma.js";
import { conflict } from "../lib/AppError.js";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export interface AgentRunRow {
  id: string;
  workspace_id: string;
  project_id: string;
  requested_by: string;
  agent_type: string;
  status: string;
  input: unknown;
  result: unknown;
  budget_limit: number;
  budget_used: number;
  idempotency_key: string | null;
  created_at: Date;
  finished_at: Date | null;
}

export async function listAgentRuns(workspaceId: string, projectId: string) {
  return prisma.$queryRaw<AgentRunRow[]>`
    SELECT id, workspace_id, project_id, requested_by, agent_type, status, input, result,
      budget_limit, budget_used, idempotency_key, created_at, finished_at
    FROM agent_runs WHERE workspace_id = ${workspaceId}::uuid AND project_id = ${projectId}::uuid
    ORDER BY created_at DESC LIMIT 50
  `;
}

export async function getAgentRun(workspaceId: string, projectId: string, runId: string) {
  const rows = await prisma.$queryRaw<AgentRunRow[]>`
    SELECT id, workspace_id, project_id, requested_by, agent_type, status, input, result,
      budget_limit, budget_used, idempotency_key, created_at, finished_at
    FROM agent_runs WHERE id = ${runId}::uuid AND workspace_id = ${workspaceId}::uuid AND project_id = ${projectId}::uuid
  `;
  if (!rows[0]) return null;
  const steps = await prisma.$queryRaw<Array<{ id: string; step_index: number; agent_role: string; status: string; input: unknown; result: unknown; citations: unknown; started_at: Date; finished_at: Date | null }>>`
    SELECT id, step_index, agent_role, status, input, result, citations, started_at, finished_at
    FROM agent_run_steps WHERE run_id = ${runId}::uuid ORDER BY step_index ASC
  `;
  const evaluations = await prisma.$queryRaw<Array<{ case_key: string; passed: boolean; metrics: unknown; latency_ms: number | null; created_at: Date }>>`
    SELECT case_key, passed, metrics, latency_ms, created_at FROM ai_evaluations
    WHERE run_id = ${runId}::uuid AND workspace_id = ${workspaceId}::uuid ORDER BY created_at DESC LIMIT 5
  `;
  return { ...rows[0], steps, evaluations };
}

export async function saveAgentRun(input: {
  workspaceId: string;
  projectId: string;
  userId: string;
  agentType: string;
  requestInput: unknown;
  result: unknown;
  budgetLimit: number;
  budgetUsed: number;
  idempotencyKey: string;
  steps: Array<{ role: string; input: unknown; result: unknown; citations: unknown }>;
  evaluation: { caseKey: string; passed: boolean; metrics: unknown; latencyMs: number };
}) {
  return prisma.$transaction(async (tx) => {
    // Advisory locks return PostgreSQL's `void` type; execute rather than deserialize a result row.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${input.workspaceId}:${input.userId}:${input.idempotencyKey}`}, 0))`;
    const prior = await tx.$queryRaw<AgentRunRow[]>`
      SELECT id, workspace_id, project_id, requested_by, agent_type, status, input, result,
        budget_limit, budget_used, idempotency_key, created_at, finished_at
      FROM agent_runs WHERE workspace_id = ${input.workspaceId}::uuid AND requested_by = ${input.userId}::uuid
        AND idempotency_key = ${input.idempotencyKey} LIMIT 1
    `;
    if (prior[0]) {
      if (canonical(prior[0].input) !== canonical(input.requestInput)) throw conflict("This Idempotency-Key was already used for a different agent request");
      return { run: prior[0], replayed: true };
    }
    const inserted = await tx.$queryRaw<AgentRunRow[]>`
      INSERT INTO agent_runs (workspace_id, project_id, requested_by, agent_type, status, input, result, budget_limit, budget_used, idempotency_key, finished_at)
      VALUES (${input.workspaceId}::uuid, ${input.projectId}::uuid, ${input.userId}::uuid, ${input.agentType}, 'SUCCEEDED', ${JSON.stringify(input.requestInput)}::jsonb, ${JSON.stringify(input.result)}::jsonb, ${input.budgetLimit}, ${input.budgetUsed}, ${input.idempotencyKey}, now())
      RETURNING id, workspace_id, project_id, requested_by, agent_type, status, input, result,
        budget_limit, budget_used, idempotency_key, created_at, finished_at
    `;
    const run = inserted[0]!;
    for (const [index, step] of input.steps.entries()) {
      await tx.$executeRaw`
        INSERT INTO agent_run_steps (run_id, step_index, agent_role, status, input, result, citations, finished_at)
        VALUES (${run.id}::uuid, ${index + 1}, ${step.role}, 'SUCCEEDED', ${JSON.stringify(step.input)}::jsonb, ${JSON.stringify(step.result)}::jsonb, ${JSON.stringify(step.citations)}::jsonb, now())
      `;
    }
    await tx.$executeRaw`
      INSERT INTO ai_evaluations (workspace_id, project_id, run_id, case_key, passed, metrics, latency_ms)
      VALUES (${input.workspaceId}::uuid, ${input.projectId}::uuid, ${run.id}::uuid, ${input.evaluation.caseKey}, ${input.evaluation.passed}, ${JSON.stringify(input.evaluation.metrics)}::jsonb, ${input.evaluation.latencyMs})
    `;
    return { run, replayed: false };
  });
}
