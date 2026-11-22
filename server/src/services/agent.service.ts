import { randomUUID } from "node:crypto";
import { badRequest, forbidden } from "../lib/AppError.js";
import { calculateExecutionAnalytics } from "../lib/graph/analytics.js";
import { findWorkspaceMembership } from "../repositories/workspace.repository.js";
import { getAgentRun, listAgentRuns, saveAgentRun } from "../repositories/agent.repository.js";
import { loadProjectAnalytics } from "../repositories/analytics.repository.js";
import { getProjectDeliveryHealth } from "./delivery-health.service.js";
import { writeAuditLog } from "./audit.service.js";

type AgentType = "PLANNER" | "EVIDENCE" | "RISK" | "FORECAST" | "RECOVERY" | "EXECUTION" | "COORDINATOR";

async function requireProject(workspaceId: string, projectId: string, userId: string) {
  if (!(await findWorkspaceMembership(workspaceId, userId))) throw forbidden("You are not a member of this workspace");
  const project = await loadProjectAnalytics(workspaceId, projectId);
  if (!project) throw badRequest("Project not found");
  return project;
}

function runStep(role: string, analytics: ReturnType<typeof calculateExecutionAnalytics>, health: Awaited<ReturnType<typeof getProjectDeliveryHealth>>, question?: string) {
  const critical = analytics.graph.criticalPath;
  const citations = [...new Set([
    ...critical.map((item) => item.taskId),
    ...analytics.bottlenecks.map((item) => item.taskId),
    ...analytics.dependencyCentrality.slice(0, 5).map((item) => item.taskId),
  ])].slice(0, 40);
  switch (role) {
    case "PLANNER":
      return { role, result: { title: "Suggested execution order", items: analytics.graph.taskSlack.slice(0, 12).map((item) => ({ taskId: item.taskId, title: item.title, slackDays: item.slackDays, critical: item.slackDays === 0, startDay: item.earliestStartDay, finishDay: item.earliestFinishDay })), note: "Sequence is calculated from the current dependency graph and saved task durations." }, citations: analytics.graph.taskSlack.slice(0, 12).map((item) => item.taskId) };
    case "EVIDENCE":
      return { role, result: { title: "Evidence coverage", items: [{ label: "Observed task updates", value: health.health.evidenceCoverage }, { label: "Average evidence confidence", value: health.health.averageEvidenceConfidence }, { label: "Task history samples", value: analytics.cycleTime.sampleCount }], note: "Values come from stored task history and linked evidence." }, citations };
    case "RISK":
      return { role, result: { title: "Risks grounded in current project data", items: analytics.bottlenecks.map((item) => ({ taskId: item.taskId, title: item.title, reason: item.reason, severity: item.severity })), overdueCount: health.riskFactors.find((risk) => risk.code === "OVERDUE_TASKS")?.count ?? 0, blockedCount: health.health.blockedTasks }, citations: analytics.bottlenecks.map((item) => item.taskId) };
    case "FORECAST":
      return { role, result: { title: "Delivery forecast", p50: health.forecast.p50, p85: health.forecast.p85, confidence: health.forecast.confidence, sampleCount: health.forecast.sampleCount, criticalPathDays: analytics.graph.estimatedDurationDays, deadlineDrift: health.drift, basis: health.forecast.basis }, citations: critical.map((item) => item.taskId) };
    case "RECOVERY":
      return { role, result: { title: "Recovery review", items: analytics.bottlenecks.slice(0, 8).map((item) => ({ taskId: item.taskId, title: item.title, reason: item.reason, severity: item.severity })), nextStep: "Review the recovery options before approving any task or dependency change.", makesChanges: false }, citations: analytics.bottlenecks.map((item) => item.taskId) };
    case "EXECUTION":
      return { role, result: { title: "Execution guardrail", summary: question ? `Prepared an analysis for: ${question}` : "Prepared a project execution summary.", nextStep: "No project data was changed. Submit a separate human-approved action to change tasks or dependencies.", requiresHumanApproval: true, openTasks: analytics.openCount, criticalTaskCount: critical.length }, citations };
    default:
      return { role, result: { title: "Project coordination", criticalTaskCount: critical.length, bottlenecks: analytics.bottlenecks.slice(0, 5), forecast: { p50: health.forecast.p50, p85: health.forecast.p85, confidence: health.forecast.confidence }, evidenceCoverage: health.health.evidenceCoverage, suggestedNextStep: critical[0] ? `Review ${critical[0].title}` : "Add tasks and dependencies to create an execution plan." }, citations };
  }
}

export async function createAgentRun(input: { workspaceId: string; projectId: string; userId: string; agentType: AgentType; budgetLimit: number; question?: string; idempotencyKey?: string }) {
  const project = await requireProject(input.workspaceId, input.projectId, input.userId);
  const requestInput = { agentType: input.agentType, budgetLimit: input.budgetLimit, question: input.question ?? null };
  const idempotencyKey = input.idempotencyKey?.trim() || randomUUID();
  if (idempotencyKey.length > 120) throw badRequest("Idempotency-Key must be 120 characters or fewer");

  const budgetUsed = project.tasks.length + project.edges.length + project.history.length;
  if (budgetUsed > input.budgetLimit) throw badRequest(`This run needs ${budgetUsed} work units, above the ${input.budgetLimit} unit limit. Raise the budget or reduce project history.`);
  let analytics: ReturnType<typeof calculateExecutionAnalytics>;
  try {
    analytics = calculateExecutionAnalytics({ tasks: project.tasks, edges: project.edges, history: project.history });
  } catch {
    throw badRequest("The project dependency graph contains a cycle. Fix it before running an agent.");
  }
  const health = await getProjectDeliveryHealth(input.workspaceId, input.projectId, input.userId);
  const roles = input.agentType === "COORDINATOR" ? ["PLANNER", "RISK", "FORECAST", "EVIDENCE"] : [input.agentType];
  const steps = roles.map((role) => runStep(role, analytics, health, input.question));
  const output = {
    generatedAt: new Date().toISOString(),
    project: project.project,
    summary: `${analytics.openCount} open tasks, ${analytics.graph.criticalPath.length} critical path tasks, and ${analytics.bottlenecks.length} flagged bottlenecks.`,
    steps: steps.map(({ role, result }) => ({ role, result })),
    citations: [...new Set(steps.flatMap((step) => step.citations))].map((taskId) => {
      const task = project.tasks.find((item) => item.id === taskId);
      return task ? { taskId, title: task.title } : null;
    }).filter((item): item is { taskId: string; title: string } => item !== null),
    safety: { mode: "deterministic analysis", makesChanges: false, humanApprovalRequiredForChanges: true },
  };
  const startedAt = Date.now();
  const saved = await saveAgentRun({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
    agentType: input.agentType,
    requestInput,
    result: output,
    budgetLimit: input.budgetLimit,
    budgetUsed,
    idempotencyKey,
    steps: steps.map((step) => ({ role: step.role, input: { projectId: input.projectId, question: input.question ?? null }, result: step.result, citations: step.citations })),
    evaluation: { caseKey: `agent-${input.agentType.toLowerCase()}-grounded-v1`, passed: output.citations.every((citation) => project.tasks.some((task) => task.id === citation.taskId)), metrics: { citationCount: output.citations.length, stepCount: steps.length, budgetUsed, budgetLimit: input.budgetLimit, mutationsAllowed: false }, latencyMs: Date.now() - startedAt },
  });
  if (!saved.replayed) await writeAuditLog({ workspaceId: input.workspaceId, actorId: input.userId, action: "AGENT_RUN_CREATED", targetType: "AGENT_RUN", targetId: saved.run.id, metadata: { projectId: input.projectId, agentType: input.agentType, budgetUsed, stepCount: steps.length } });
  return { ...saved, detail: await getAgentRun(input.workspaceId, input.projectId, saved.run.id) };
}

export async function getAgentRunList(workspaceId: string, projectId: string, userId: string) {
  await requireProject(workspaceId, projectId, userId);
  return listAgentRuns(workspaceId, projectId);
}

export async function getAgentRunDetail(workspaceId: string, projectId: string, runId: string, userId: string) {
  await requireProject(workspaceId, projectId, userId);
  const run = await getAgentRun(workspaceId, projectId, runId);
  if (!run) throw badRequest("Agent run not found");
  return run;
}
