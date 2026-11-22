import { badRequest, forbidden } from "../lib/AppError.js";
import { calculateExecutionAnalytics } from "../lib/graph/analytics.js";
import { findWorkspaceMembership } from "../repositories/workspace.repository.js";
import { createAnalyticsSnapshot, listAnalyticsSnapshots, loadProjectAnalytics } from "../repositories/analytics.repository.js";
import { writeAuditLog } from "./audit.service.js";

async function requireMember(workspaceId: string, projectId: string, userId: string) {
  if (!(await findWorkspaceMembership(workspaceId, userId))) throw forbidden("You are not a member of this workspace");
  const loaded = await loadProjectAnalytics(workspaceId, projectId);
  if (!loaded) throw badRequest("Project not found");
  return loaded;
}

export async function getProjectAnalytics(workspaceId: string, projectId: string, userId: string) {
  const input = await requireMember(workspaceId, projectId, userId);
  let result;
  try {
    result = calculateExecutionAnalytics({ tasks: input.tasks, edges: input.edges, history: input.history });
  } catch {
    throw badRequest("The project dependency graph contains a cycle. Fix the graph before calculating analytics.");
  }
  return { project: input.project, baselineVersion: input.baselineVersion, ...result };
}

export async function saveProjectAnalyticsSnapshot(workspaceId: string, projectId: string, userId: string) {
  const analytics = await getProjectAnalytics(workspaceId, projectId, userId);
  const saved = await createAnalyticsSnapshot(workspaceId, projectId, userId, analytics);
  await writeAuditLog({ workspaceId, actorId: userId, action: "EXECUTION_HISTORY_SNAPSHOT_CREATED", targetType: "PROJECT", targetId: projectId, metadata: { snapshotId: saved.id, taskCount: analytics.taskCount } });
  return { id: saved.id, createdAt: saved.created_at, analytics };
}

export async function getProjectAnalyticsHistory(workspaceId: string, projectId: string, userId: string) {
  await requireMember(workspaceId, projectId, userId);
  return listAnalyticsSnapshots(workspaceId, projectId);
}
