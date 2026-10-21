import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validateBody.js";
import { CreateDependencySchema } from "../schemas/execution.schema.js";
import { getGraph, postDependency, removeDependency } from "../controllers/execution.controller.js";

const router = Router();
router.get("/projects/:projectId/graph", requireAuth, workspaceContext, getGraph);
router.post("/projects/:projectId/dependencies", requireAuth, workspaceContext, requirePermission("MANAGE_DEPENDENCIES"), validateBody(CreateDependencySchema), postDependency);
router.delete("/projects/:projectId/dependencies/:dependencyId", requireAuth, workspaceContext, requirePermission("MANAGE_DEPENDENCIES"), removeDependency);
export default router;
