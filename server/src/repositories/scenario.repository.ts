import { prisma } from "../db/prisma.js";

export interface ScenarioRecord {
  id: string;
  workspace_id: string;
  project_id: string;
  name: string;
  changes: unknown;
  created_by: string;
  created_at: Date;
}

export async function createScenario(workspaceId: string, projectId: string, userId: string, name: string, changes: unknown) {
  const rows = await prisma.$queryRaw<ScenarioRecord[]>`
    INSERT INTO execution_scenarios (workspace_id, project_id, created_by, name, changes)
    VALUES (${workspaceId}::uuid, ${projectId}::uuid, ${userId}::uuid, ${name}, ${JSON.stringify(changes)}::jsonb)
    RETURNING id, workspace_id, project_id, created_by, name, changes, created_at
  `;
  return rows[0]!;
}

export async function findScenario(workspaceId: string, projectId: string, scenarioId: string) {
  const rows = await prisma.$queryRaw<ScenarioRecord[]>`
    SELECT id, workspace_id, project_id, created_by, name, changes, created_at
    FROM execution_scenarios
    WHERE id = ${scenarioId}::uuid AND workspace_id = ${workspaceId}::uuid AND project_id = ${projectId}::uuid
  `;
  return rows[0] ?? null;
}

export async function listScenarios(workspaceId: string, projectId: string) {
  return prisma.$queryRaw<Array<ScenarioRecord & { latest_run: unknown }>>`
    SELECT s.id, s.workspace_id, s.project_id, s.created_by, s.name, s.changes, s.created_at,
      (SELECT jsonb_build_object('id', r.id, 'createdAt', r.created_at, 'result', r.result)
       FROM execution_scenario_runs r WHERE r.scenario_id = s.id ORDER BY r.created_at DESC LIMIT 1) AS latest_run
    FROM execution_scenarios s
    WHERE s.workspace_id = ${workspaceId}::uuid AND s.project_id = ${projectId}::uuid
    ORDER BY s.created_at DESC LIMIT 100
  `;
}

export async function saveScenarioRun(scenarioId: string, workspaceId: string, projectId: string, inputHash: string, snapshot: unknown, result: unknown) {
  const rows = await prisma.$queryRaw<Array<{ id: string; created_at: Date; result: unknown }>>`
    INSERT INTO execution_scenario_runs (scenario_id, workspace_id, project_id, input_hash, input_snapshot, result)
    VALUES (${scenarioId}::uuid, ${workspaceId}::uuid, ${projectId}::uuid, ${inputHash}, ${JSON.stringify(snapshot)}::jsonb, ${JSON.stringify(result)}::jsonb)
    ON CONFLICT (scenario_id, input_hash) DO UPDATE SET input_hash = EXCLUDED.input_hash
    RETURNING id, created_at, result
  `;
  return rows[0]!;
}

export async function listScenarioRuns(workspaceId: string, projectId: string, scenarioId: string) {
  return prisma.$queryRaw<Array<{ id: string; input_hash: string; created_at: Date; input_snapshot: unknown; result: unknown }>>`
    SELECT id, input_hash, created_at, input_snapshot, result
    FROM execution_scenario_runs
    WHERE scenario_id = ${scenarioId}::uuid AND workspace_id = ${workspaceId}::uuid AND project_id = ${projectId}::uuid
    ORDER BY created_at DESC LIMIT 50
  `;
}

export async function findWorkspaceMemberIds(workspaceId: string, userIds: string[]) {
  if (!userIds.length) return [];
  const rows = await prisma.workspace_members.findMany({ where: { workspace_id: workspaceId, user_id: { in: userIds } }, select: { user_id: true } });
  return rows.map((row) => row.user_id);
}
