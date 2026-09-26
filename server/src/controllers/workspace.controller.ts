import type { RequestHandler } from "express";
import type { CreateWorkspaceBody } from "../schemas/workspace.schema.js";

import {
  createWorkspaceService,
  getUserWorkspacesService,
} from "../services/workspace.service.js";

import {
  badRequest,
  unauthorized,
} from "../lib/AppError.js";

import type { ApiResponse } from "../types/apiResponse.js";

export const getWorkspaces: RequestHandler = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw unauthorized("Authentication required");
  }

  const workspaces = await getUserWorkspacesService(userId);

  const response: ApiResponse<typeof workspaces> = {
    success: true,
    message: "Workspaces fetched",
    data: workspaces,
  };

  res.json(response);
};

export const createWorkspace: RequestHandler<
  {},
  any,
  CreateWorkspaceBody
> = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw unauthorized("Authentication required");
  }

  const { name } = req.body;

  const workspace = await createWorkspaceService(userId, name);

  const response: ApiResponse<typeof workspace> = {
    success: true,
    message: "Workspace created successfully",
    data: workspace,
  };

  res.status(201).json(response);
};

export const getCurrentWorkspace: RequestHandler = async (
  req,
  res,
) => {
  if (!req.workspace) {
    throw badRequest("Workspace context is required");
  }

  const response: ApiResponse<{
    workspaceId: string;
    role: string;
  }> = {
    success: true,
    message: "Workspace role fetched",
    data: {
      workspaceId: req.workspace.id,
      role: req.workspace.role,
    },
  };

  res.json(response);
};