import type { Request, Response } from "express";
import { workspaces } from "../data/fakeStore.js";

export function getWorkspaces(req: Request, res: Response) {
  res.json({
    workspaces,
  });
}
