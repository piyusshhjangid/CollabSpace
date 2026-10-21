import type { RequestHandler } from "express";
import type { ApiResponse } from "../types/apiResponse.js";
import { badRequest, unauthorized } from "../lib/AppError.js";
import { createContract, createDependency, createExecutionPlan, createGoal, createMilestone, createOutcome, deleteDependency, getExecutionGraph, listOutcomes } from "../services/execution.service.js";
import { publishExecutionEvent } from "../realtime/server.js";

function context(req: Parameters<RequestHandler>[0]) {
  const workspaceId = req.workspace?.id;
  const userId = req.user?.id;
  if (!workspaceId) throw badRequest("Workspace context is required");
  if (!userId) throw unauthorized("Authentication required");
  return { workspaceId, userId };
}
function param(req: Parameters<RequestHandler>[0], key: string) {
  const value = req.params[key];
  if (typeof value !== "string") throw badRequest(`${key} is required`);
  return value;
}
function send(res: Parameters<RequestHandler>[1], message: string, data: unknown, status = 200) {
  const response: ApiResponse<unknown> = { success: true, message, data };
  res.status(status).json(response);
}

export const getOutcomes: RequestHandler = async (req, res) => {
  const { workspaceId, userId } = context(req);
  send(res, "Outcomes fetched", await listOutcomes(workspaceId, userId));
};
export const postOutcome: RequestHandler = async (req, res) => {
  const { workspaceId, userId } = context(req);
  send(res, "Outcome created", await createOutcome(workspaceId, userId, req.body), 201);
};
export const postGoal: RequestHandler = async (req, res) => {
  const { workspaceId, userId } = context(req);
  send(res, "Goal created", await createGoal(workspaceId, userId, param(req, "outcomeId"), req.body), 201);
};
export const postMilestone: RequestHandler = async (req, res) => {
  const { workspaceId, userId } = context(req);
  send(res, "Milestone created", await createMilestone(workspaceId, userId, param(req, "goalId"), req.body), 201);
};
export const postContract: RequestHandler = async (req, res) => {
  const { workspaceId, userId } = context(req);
  send(res, "Delivery contract version created", await createContract(workspaceId, userId, param(req, "outcomeId"), req.body), 201);
};
export const postPlan: RequestHandler = async (req, res) => {
  const { workspaceId, userId } = context(req);
  send(res, "Execution plan snapshot created", await createExecutionPlan(workspaceId, userId, param(req, "outcomeId"), req.body), 201);
};
export const getGraph: RequestHandler = async (req, res) => {
  const { workspaceId, userId } = context(req);
  send(res, "Execution graph fetched", await getExecutionGraph(workspaceId, userId, param(req, "projectId")));
};
export const postDependency: RequestHandler = async (req, res) => {
  const { workspaceId, userId } = context(req);
  const dependency = await createDependency(workspaceId, userId, param(req, "projectId"), req.body);
  await publishExecutionEvent(workspaceId, "dependency", "created", dependency.id).catch(() => null);
  send(res, "Dependency created", dependency, 201);
};
export const removeDependency: RequestHandler = async (req, res) => {
  const { workspaceId, userId } = context(req);
  const dependency = await deleteDependency(workspaceId, userId, param(req, "projectId"), param(req, "dependencyId"));
  await publishExecutionEvent(workspaceId, "dependency", "deleted", dependency.id).catch(() => null);
  send(res, "Dependency removed", dependency);
};
