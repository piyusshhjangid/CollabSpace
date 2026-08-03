import { Router } from "express";
import type { Request, Response } from "express";
import { projects } from "../data/fakeStore.js";

const router = Router({
  mergeParams: true,
});

router.get("/", (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const workSpaceProjects = projects.filter(
    (project) => project.workspaceId === workspaceId,
  );
  res.json(workSpaceProjects);
});

export default router;
