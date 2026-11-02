import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { badRequest } from "../lib/AppError.js";
import { routeParam } from "../lib/routeParam.js";
import { listProjectEvidence, reconcileWorkspaceTruth } from "../services/execution-truth.service.js";
import { getProjectDeliveryHealth } from "../services/delivery-health.service.js";

export async function getHealth(req: Request, res: Response) {
  res.json({ health: await getProjectDeliveryHealth(req.workspace!.id, routeParam(req, "projectId"), req.user!.id) });
}

export async function getTimeline(req: Request, res: Response) {
  res.json(await listProjectEvidence(req.workspace!.id, routeParam(req, "projectId"), req.user!.id));
}

export async function getTaskEvidence(req: Request, res: Response) {
  const taskId = routeParam(req, "taskId");
  const projectId = routeParam(req, "projectId");
  const task = await prisma.tasks.findFirst({ where: { id: taskId, workspace_id: req.workspace!.id, project_id: projectId }, select: { id: true, title: true, status: true, completed: true } });
  if (!task) throw badRequest("Task not found");
  const result = await listProjectEvidence(req.workspace!.id, projectId, req.user!.id, taskId);
  res.json({ task, ...result });
}

export async function reconcile(req: Request, res: Response) {
  const projectId = routeParam(req, "projectId");
  const project = await prisma.projects.findFirst({ where: { id: projectId, workspace_id: req.workspace!.id }, select: { id: true } });
  if (!project) throw badRequest("Project not found");
  const updatedTasks = await reconcileWorkspaceTruth(req.workspace!.id, projectId);
  res.json({ updatedTasks, reconciledAt: new Date().toISOString() });
}

export async function getProjectTruth(req: Request, res: Response) {
  const projectId = routeParam(req, "projectId");
  const project = await prisma.projects.findFirst({ where: { id: projectId, workspace_id: req.workspace!.id }, select: { id: true } });
  if (!project) throw badRequest("Project not found");
  const [tasks, truths] = await Promise.all([
    prisma.tasks.findMany({ where: { workspace_id: req.workspace!.id, project_id: projectId }, select: { id: true, task_key: true, title: true, status: true, completed: true }, orderBy: { created_at: "asc" } }),
    prisma.task_truth.findMany({ where: { workspace_id: req.workspace!.id, project_id: projectId } }),
  ]);
  const byTask = new Map(truths.map((truth) => [truth.task_id, truth]));
  res.json({ tasks: tasks.map((task) => {
    const truth = byTask.get(task.id);
    return { id: task.id, taskKey: task.task_key, title: task.title, declaredStatus: task.completed ? "DONE" : task.status, observedStatus: truth?.observed_status ?? "UNVERIFIED", confidence: truth?.confidence ?? 0, explanation: truth?.explanation ?? "No linked evidence has been reconciled yet.", evidenceCount: truth?.evidence_count ?? 0, reconciledAt: truth?.reconciled_at ?? null };
  }) });
}
