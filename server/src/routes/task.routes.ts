import { Router } from "express";
import {
  getTasks,
  createTask,
} from "../controllers/task.controller.js";

import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { validateBody } from "../middleware/validateBody.js";
import { CreateTaskSchema } from "../schemas/task.schema.js";

const router = Router({ mergeParams: true });

router.get(
  "/",
  requireAuth,
  workspaceContext,
  getTasks,
);

router.post(
  "/",
  requireAuth,
  workspaceContext,
  validateBody(CreateTaskSchema),
  createTask,
);

export default router;