import { prisma } from "../db/prisma.js";
import { forbidden } from "../lib/AppError.js";
import { findWorkspaceMembership } from "../repositories/workspace.repository.js";

const evidenceWeights: Record<string, number> = {
  COMMIT_PUSHED: 0.4,
  PULL_REQUEST_OPEN: 0.58,
  PULL_REQUEST_MERGED: 0.88,
  PULL_REQUEST_CLOSED: 0.68,
  REVIEW_APPROVED: 0.65,
  REVIEW_CHANGES_REQUESTED: 0.82,
  CI_PASSED: 0.72,
  CI_FAILED: 0.86,
  ISSUE_CLOSED: 0.62,
  DEPLOY_SUCCEEDED: 0.96,
  DEPLOY_FAILED: 0.92,
};

export function classifyGithubEvidence(eventType: string, action: string | null, metadata: Record<string, unknown>) {
  if (eventType === "push") return { type: "COMMIT_PUSHED", status: "IN_PROGRESS", explanation: "A commit was pushed to the linked branch." };
  if (eventType === "pull_request" && action === "closed" && metadata.merged === true) return { type: "PULL_REQUEST_MERGED", status: "PARTIALLY_COMPLETE", explanation: "The linked pull request was merged; deployment evidence is still needed to confirm completion." };
  if (eventType === "pull_request" && action === "closed") return { type: "PULL_REQUEST_CLOSED", status: "AT_RISK", explanation: "The linked pull request was closed without merging." };
  if (eventType === "pull_request" && ["opened", "reopened", "synchronize", "ready_for_review"].includes(action ?? "")) return { type: "PULL_REQUEST_OPEN", status: "IN_PROGRESS", explanation: "A pull request references this task." };
  if (eventType === "pull_request_review" && metadata.state === "approved") return { type: "REVIEW_APPROVED", status: "IN_PROGRESS", explanation: "A review approved the linked pull request." };
  if (eventType === "pull_request_review" && metadata.state === "changes_requested") return { type: "REVIEW_CHANGES_REQUESTED", status: "AT_RISK", explanation: "A review requested changes on the linked pull request." };
  if ((eventType === "check_run" || eventType === "workflow_run") && metadata.conclusion === "success") return { type: "CI_PASSED", status: "PARTIALLY_COMPLETE", explanation: "A linked continuous integration run completed successfully." };
  if ((eventType === "check_run" || eventType === "workflow_run") && ["failure", "cancelled", "timed_out", "action_required"].includes(String(metadata.conclusion))) return { type: "CI_FAILED", status: "AT_RISK", explanation: "A linked continuous integration run did not succeed." };
  if (eventType === "issues" && action === "closed") return { type: "ISSUE_CLOSED", status: "PARTIALLY_COMPLETE", explanation: "The linked GitHub issue was closed." };
  if (eventType === "deployment_status" && metadata.state === "success") return { type: "DEPLOY_SUCCEEDED", status: "COMPLETE", explanation: "A linked deployment completed successfully." };
  if (eventType === "deployment_status" && ["failure", "error"].includes(String(metadata.state))) return { type: "DEPLOY_FAILED", status: "AT_RISK", explanation: "A linked deployment failed." };
  return null;
}

export async function reconcileTaskTruth(taskId: string) {
  const task = await prisma.tasks.findFirst({ where: { id: taskId }, select: { id: true, workspace_id: true, project_id: true, status: true, completed: true } });
  if (!task) return null;
  const evidence = await prisma.task_evidence.findMany({ where: { task_id: taskId, workspace_id: task.workspace_id }, orderBy: { captured_at: "desc" }, take: 100 });
  const scores = new Map<string, number>();
  for (const item of evidence) {
    const ageDays = Math.max(0, (Date.now() - item.captured_at.getTime()) / 86_400_000);
    const decay = Math.pow(0.5, ageDays / 30);
    scores.set(item.observed_status, (scores.get(item.observed_status) ?? 0) + (evidenceWeights[item.evidence_type] ?? 0.5) * item.confidence * decay);
  }
  const ranking = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const total = ranking.reduce((sum, item) => sum + item[1], 0);
  const hasConflict = ranking.length > 1 && Math.abs(ranking[0]![1] - ranking[1]![1]) < 0.12;
  const observed = ranking.length === 0 ? "UNVERIFIED" : hasConflict ? "CONFLICT" : ranking[0]![0];
  const confidence = total > 0 ? Number((hasConflict ? 0.5 : ranking[0]![1] / total).toFixed(3)) : 0;
  const explanation = ranking.length === 0
    ? "There is not enough external evidence to verify observed progress."
    : ranking.length > 1 && Math.abs(ranking[0]![1] - ranking[1]![1]) < 0.12
      ? `Evidence is mixed between ${ranking[0]![0].toLowerCase()} and ${ranking[1]![0].toLowerCase()}; review the timeline.`
      : `${evidence.length} immutable observation(s) were weighted by source confidence and age. The strongest signal is ${observed.toLowerCase()}.`;
  const declared = task.completed ? "DONE" : task.status.toUpperCase();
  return prisma.task_truth.upsert({
    where: { task_id: taskId },
    create: { task_id: taskId, workspace_id: task.workspace_id, project_id: task.project_id, declared_status: declared, observed_status: observed, confidence, explanation, evidence_count: evidence.length },
    update: { declared_status: declared, observed_status: observed, confidence, explanation, evidence_count: evidence.length, reconciled_at: new Date() },
  });
}

export async function reconcileWorkspaceTruth(workspaceId: string, projectId?: string) {
  const taskIds = await prisma.tasks.findMany({ where: { workspace_id: workspaceId, ...(projectId ? { project_id: projectId } : {}) }, select: { id: true } });
  let updated = 0;
  for (const task of taskIds) {
    if (await reconcileTaskTruth(task.id)) updated++;
  }
  return updated;
}

export async function listProjectEvidence(workspaceId: string, projectId: string, userId: string, taskId?: string) {
  if (!(await findWorkspaceMembership(workspaceId, userId))) throw forbidden("You are not a member of this workspace");
  const project = await prisma.projects.findFirst({ where: { id: projectId, workspace_id: workspaceId }, select: { id: true } });
  if (!project) return [];
  const where = { workspace_id: workspaceId, project_id: projectId, ...(taskId ? { task_id: taskId } : {}) };
  const [events, evidence, truths] = await Promise.all([
    prisma.execution_events.findMany({ where: { ...where, ...(taskId ? { task_id: taskId } : {}) }, orderBy: { occurred_at: "desc" }, take: 100 }),
    prisma.task_evidence.findMany({ where, orderBy: { captured_at: "desc" }, take: 200 }),
    prisma.task_truth.findMany({ where: { workspace_id: workspaceId, project_id: projectId, ...(taskId ? { task_id: taskId } : {}) }, orderBy: { reconciled_at: "desc" }, take: 200 }),
  ]);
  return { events, evidence, truths };
}
