import type { Request, Response } from "express";
import { getAllWorkspaces as getAllWorkspacesService } from "../services/workspace.service.js";
import type { Workspace } from "../types/workspace.js";
import type { ApiResponse } from "../types/apiResponse.js";

export async function getWorkspaces(req: Request, res: Response) {
  const allWorkspaces = await getAllWorkspacesService();
  const response: ApiResponse<Workspace[]> = {
      success: true,
      message: "Workspaces fetched",
      data: allWorkspaces,
    };
  
    res.json(response);
}
