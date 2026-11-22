import { createHash } from "node:crypto";
import { badRequest, forbidden } from "../lib/AppError.js";
import { simulateScenario, type ScenarioChanges } from "../lib/simulation.js";
import { findWorkspaceMembership } from "../repositories/workspace.repository.js";
import { findWorkspaceMemberIds, createScenario as insertScenario, findScenario, listScenarios, listScenarioRuns, saveScenarioRun } from "../repositories/scenario.repository.js";
import { loadProjectAnalytics } from "../repositories/analytics.repository.js";
import { writeAuditLog } from "./audit.service.js";
import { CreateScenarioSchema } from "../schemas/intelligence.schema.js";

async function requireMember(workspaceId: string, projectId: string, userId: string) {
  if (!(await findWorkspaceMembership(workspaceId, userId))) throw forbidden("You are not a member of this workspace");
  const project = await loadProjectAnalytics(workspaceId, projectId);
  if (!project) throw badRequest("Project not found");
  return project;
}

export async function createProjectScenario(workspaceId: string, projectId: string, userId: string, input: unknown) {
  await requireMember(workspaceId, projectId, userId);
  const parsed = CreateScenarioSchema.parse(input);
  const row = await insertScenario(workspaceId, projectId, userId, parsed.name, parsed.changes);
  await writeAuditLog({ workspaceId, actorId: userId, action: "SCENARIO_CREATED", targetType: "EXECUTION_SCENARIO", targetId: row.id, metadata: { projectId, name: parsed.name } });
  return row;
}

export async function getProjectScenarios(workspaceId: string, projectId: string, userId: string) {
  await requireMember(workspaceId, projectId, userId);
  return listScenarios(workspaceId, projectId);
}

export async function runProjectScenario(workspaceId: string, projectId: string, scenarioId: string, userId: string) {
  const project = await requireMember(workspaceId, projectId, userId);
  const scenario = await findScenario(workspaceId, projectId, scenarioId);
  if (!scenario) throw badRequest("Scenario not found");
  const changes = CreateScenarioSchema.shape.changes.parse(scenario.changes) as ScenarioChanges;
  const referencedMembers = [...(changes.unavailableAssigneeIds ?? []), ...(changes.reassignTasks ?? []).map((change) => change.assigneeId)];
  const memberIds = await findWorkspaceMemberIds(workspaceId, referencedMembers);
  if (memberIds.length !== new Set(referencedMembers).size) throw badRequest("Scenario capacity changes must reference current workspace members");
  const simulatedAt = new Date();
  const sortedEdges = [...project.edges].sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
  const inputSnapshot = { projectId, baselineVersion: project.baselineVersion, simulatedAt: simulatedAt.toISOString(), tasks: project.tasks.map((task) => ({ id: task.id, title: task.title, status: task.status, assignedTo: task.assignedTo, durationDays: task.durationDays })), edges: sortedEdges, changes, deadline: project.deliveryDeadline?.toISOString() ?? null };
  const inputHash = createHash("sha256").update(JSON.stringify(inputSnapshot)).digest("hex");
  let result: ReturnType<typeof simulateScenario>;
  try {
    result = simulateScenario({ tasks: project.tasks, edges: sortedEdges, changes, startDate: simulatedAt, existingDeadline: project.deliveryDeadline });
  } catch (error) {
    throw badRequest(error instanceof Error ? error.message : "The scenario could not be simulated");
  }
  const run = await saveScenarioRun(scenario.id, workspaceId, projectId, inputHash, inputSnapshot, result);
  await writeAuditLog({ workspaceId, actorId: userId, action: "SCENARIO_SIMULATED", targetType: "EXECUTION_SCENARIO", targetId: scenario.id, metadata: { projectId, runId: run.id, inputHash, finishDate: result.scenario.finishDate, delayDays: result.scenario.delayDays } });
  return { ...run, inputHash, result };
}

export async function getScenarioHistory(workspaceId: string, projectId: string, scenarioId: string, userId: string) {
  await requireMember(workspaceId, projectId, userId);
  const scenario = await findScenario(workspaceId, projectId, scenarioId);
  if (!scenario) throw badRequest("Scenario not found");
  return listScenarioRuns(workspaceId, projectId, scenarioId);
}
