import { prisma } from "../db/prisma.js";
import { badRequest, forbidden } from "../lib/AppError.js";
import { buildGraph, criticalPath, descendants } from "../lib/graph/graph.js";
import { findWorkspaceMembership } from "../repositories/workspace.repository.js";
import type { z } from "zod";
import type { CreateContractSchema, CreateDependencySchema, CreateGoalSchema, CreateMilestoneSchema, CreateOutcomeSchema, CreatePlanSchema } from "../schemas/execution.schema.js";

type OutcomeInput = z.infer<typeof CreateOutcomeSchema>;
type GoalInput = z.infer<typeof CreateGoalSchema>;
type MilestoneInput = z.infer<typeof CreateMilestoneSchema>;
type ContractInput = z.infer<typeof CreateContractSchema>;
type PlanInput = z.infer<typeof CreatePlanSchema>;
type DependencyInput = z.infer<typeof CreateDependencySchema>;

async function requireMember(workspaceId: string, userId: string) {
  const member = await findWorkspaceMembership(workspaceId, userId);
  if (!member) throw forbidden("You are not a member of this workspace");
}
function asDate(value: string | null | undefined) { return value ? new Date(`${value}T00:00:00.000Z`) : null; }

export async function listOutcomes(workspaceId: string, userId: string) {
  await requireMember(workspaceId, userId);
  return prisma.outcomes.findMany({ where: { workspace_id: workspaceId }, orderBy: [{ target_date: "asc" }, { created_at: "desc" }], include: { goals: { orderBy: { target_date: "asc" }, include: { milestones: { orderBy: { due_date: "asc" } } } }, delivery_contracts: { orderBy: { version: "desc" } }, execution_plans: { orderBy: { version: "desc" } } } });
}

export async function createOutcome(workspaceId: string, userId: string, input: OutcomeInput) {
  await requireMember(workspaceId, userId);
  if (input.ownerId && !(await prisma.workspace_members.findFirst({ where: { workspace_id: workspaceId, user_id: input.ownerId } }))) throw badRequest("Outcome owner must be a workspace member");
  return prisma.outcomes.create({ data: { workspace_id: workspaceId, created_by: userId, name: input.name, description: input.description ?? null, success_criteria: input.successCriteria, target_date: asDate(input.targetDate), owner_id: input.ownerId ?? null } });
}

export async function createGoal(workspaceId: string, userId: string, outcomeId: string, input: GoalInput) {
  await requireMember(workspaceId, userId);
  const outcome = await prisma.outcomes.findFirst({ where: { id: outcomeId, workspace_id: workspaceId }, select: { id: true } });
  if (!outcome) throw badRequest("Outcome not found");
  return prisma.goals.create({ data: { workspace_id: workspaceId, outcome_id: outcomeId, name: input.name, success_criteria: input.successCriteria, target_date: asDate(input.targetDate) } });
}

export async function createMilestone(workspaceId: string, userId: string, goalId: string, input: MilestoneInput) {
  await requireMember(workspaceId, userId);
  const goal = await prisma.goals.findFirst({ where: { id: goalId, workspace_id: workspaceId }, select: { id: true } });
  if (!goal) throw badRequest("Goal not found");
  return prisma.milestones.create({ data: { workspace_id: workspaceId, goal_id: goalId, name: input.name, due_date: asDate(input.dueDate) } });
}

export async function createContract(workspaceId: string, userId: string, outcomeId: string, input: ContractInput) {
  await requireMember(workspaceId, userId);
  const outcome = await prisma.outcomes.findFirst({ where: { id: outcomeId, workspace_id: workspaceId }, select: { id: true } });
  if (!outcome) throw badRequest("Outcome not found");
  if (input.ownerId && !(await prisma.workspace_members.findFirst({ where: { workspace_id: workspaceId, user_id: input.ownerId } }))) throw badRequest("Contract owner must be a workspace member");
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${outcomeId}))`;
    const latest = await tx.delivery_contracts.findFirst({ where: { outcome_id: outcomeId, workspace_id: workspaceId }, orderBy: { version: "desc" }, select: { version: true } });
    return tx.delivery_contracts.create({ data: { workspace_id: workspaceId, outcome_id: outcomeId, version: (latest?.version ?? 0) + 1, scope: input.scope, deadline: asDate(input.deadline), constraints: input.constraints, acceptance_criteria: input.acceptanceCriteria, owner_id: input.ownerId ?? null, created_by: userId } });
  });
}

export async function createExecutionPlan(workspaceId: string, userId: string, outcomeId: string, input: PlanInput) {
  await requireMember(workspaceId, userId);
  const outcome = await prisma.outcomes.findFirst({ where: { id: outcomeId, workspace_id: workspaceId }, select: { id: true } });
  if (!outcome) throw badRequest("Outcome not found");
  if (input.contractId && !(await prisma.delivery_contracts.findFirst({ where: { id: input.contractId, outcome_id: outcomeId, workspace_id: workspaceId } }))) throw badRequest("Delivery contract not found for this outcome");
  const taskIds = [...new Set(input.tasks.map((task) => task.taskId))];
  if (taskIds.length !== input.tasks.length) throw badRequest("A task can only appear once in an execution plan");
  const tasks = await prisma.tasks.findMany({ where: { id: { in: taskIds }, workspace_id: workspaceId }, select: { id: true, project_id: true } });
  if (tasks.length !== taskIds.length) throw badRequest("Every planned task must belong to this workspace");
  const projectIds = new Set(tasks.map((task) => task.project_id));
  const linkedProjects = await prisma.projects.findMany({ where: { id: { in: [...projectIds] }, workspace_id: workspaceId, outcome_id: outcomeId }, select: { id: true } });
  if (linkedProjects.length !== projectIds.size) throw badRequest("Planned tasks must belong to projects linked to this outcome");
  for (const task of input.tasks) if (task.plannedStart && task.plannedEnd && task.plannedEnd < task.plannedStart) throw badRequest("Planned end must be on or after planned start");
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${outcomeId}))`;
    const latest = await tx.execution_plans.findFirst({ where: { outcome_id: outcomeId, workspace_id: workspaceId }, orderBy: { version: "desc" }, select: { version: true } });
    return tx.execution_plans.create({ data: { workspace_id: workspaceId, outcome_id: outcomeId, contract_id: input.contractId ?? null, version: (latest?.version ?? 0) + 1, created_by: userId, tasks: { create: input.tasks.map((task, index) => ({ task_id: task.taskId, planned_start: asDate(task.plannedStart), planned_end: asDate(task.plannedEnd), duration_days: task.durationDays, order_index: index })) } }, include: { tasks: { orderBy: { order_index: "asc" } } } });
  });
}

async function projectTasks(workspaceId: string, projectId: string) {
  const project = await prisma.projects.findFirst({ where: { id: projectId, workspace_id: workspaceId }, select: { id: true, outcome_id: true } });
  if (!project) throw badRequest("Project not found");
  const [tasks, edges, counter, latestPlan] = await Promise.all([
    prisma.tasks.findMany({ where: { project_id: projectId, workspace_id: workspaceId }, orderBy: { created_at: "asc" } }),
    prisma.task_dependencies.findMany({ where: { project_id: projectId, workspace_id: workspaceId } }),
    prisma.workspace_event_counters.findUnique({ where: { workspace_id: workspaceId }, select: { sequence: true } }),
    project.outcome_id ? prisma.execution_plans.findFirst({ where: { outcome_id: project.outcome_id, workspace_id: workspaceId }, orderBy: { version: "desc" }, include: { tasks: true } }) : Promise.resolve(null),
  ]);
  const graph = buildGraph(tasks.map((task) => task.id), edges.map((edge) => ({ from: edge.predecessor_task_id, to: edge.successor_task_id })));
  const durationByTask = Object.fromEntries((latestPlan?.tasks ?? []).map((item) => [item.task_id, item.duration_days]));
  const critical = criticalPath(graph, durationByTask);
  return { projectId, outcomeId: project.outcome_id, sequence: Number(counter?.sequence ?? 0), tasks: tasks.map((task) => ({ id: task.id, title: task.title, status: task.status, completed: task.completed, dueDate: task.due_date, durationDays: durationByTask[task.id] ?? 1 })), edges: edges.map((edge) => ({ id: edge.id, from: edge.predecessor_task_id, to: edge.successor_task_id, type: edge.dependency_type })), criticalPath: critical };
}

export async function getExecutionGraph(workspaceId: string, userId: string, projectId: string) {
  await requireMember(workspaceId, userId);
  return projectTasks(workspaceId, projectId);
}

export async function createDependency(workspaceId: string, userId: string, projectId: string, input: DependencyInput) {
  await requireMember(workspaceId, userId);
  const project = await prisma.projects.findFirst({ where: { id: projectId, workspace_id: workspaceId }, select: { id: true } });
  if (!project) throw badRequest("Project not found");
  if (input.predecessorTaskId === input.successorTaskId) throw badRequest("A task cannot depend on itself");
  const tasks = await prisma.tasks.findMany({ where: { project_id: projectId, workspace_id: workspaceId }, select: { id: true } });
  const taskIds = new Set(tasks.map((task) => task.id));
  if (!taskIds.has(input.predecessorTaskId) || !taskIds.has(input.successorTaskId)) throw badRequest("Both tasks must belong to this project and workspace");
  const current = await prisma.task_dependencies.findMany({ where: { project_id: projectId, workspace_id: workspaceId }, select: { predecessor_task_id: true, successor_task_id: true } });
  const graph = buildGraph(taskIds, current.map((edge) => ({ from: edge.predecessor_task_id, to: edge.successor_task_id })));
  if (descendants(graph, input.successorTaskId).includes(input.predecessorTaskId)) throw badRequest("Dependency would create a cycle");
  try {
    return await prisma.task_dependencies.create({ data: { workspace_id: workspaceId, project_id: projectId, predecessor_task_id: input.predecessorTaskId, successor_task_id: input.successorTaskId, dependency_type: input.dependencyType, created_by: userId } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") throw badRequest("Dependency already exists");
    throw error;
  }
}

export async function deleteDependency(workspaceId: string, userId: string, projectId: string, dependencyId: string) {
  await requireMember(workspaceId, userId);
  const deleted = await prisma.task_dependencies.deleteMany({ where: { id: dependencyId, project_id: projectId, workspace_id: workspaceId } });
  if (deleted.count === 0) throw badRequest("Dependency not found");
  return { id: dependencyId };
}
