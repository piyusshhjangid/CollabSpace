import { Router } from "express";
import {
  getWorkspaces,
  createWorkspace,
} from "../controllers/workspace.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody } from "../middleware/validateBody.js";
import { CreateWorkspaceSchema } from "../schemas/workspace.schema.js";

const router = Router();

router.get("/", requireAuth, getWorkspaces);

router.post(
  "/",
  requireAuth,
  validateBody(CreateWorkspaceSchema),
  createWorkspace,
);

export default router;
