import { Router } from "express";

import {
  getTasks,
  createTask,
  updateTask,
} from "../controllers/task.controller.js";

import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validateBody.js";

import {
  CreateTaskSchema,
  UpdateTaskSchema,
} from "../schemas/task.schema.js";

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
  requirePermission("CREATE_TASK"),
  validateBody(CreateTaskSchema),
  createTask,
);

router.patch(
  "/:taskId",
  requireAuth,
  workspaceContext,
  requirePermission("UPDATE_OWN_TASK"),
  validateBody(UpdateTaskSchema),
  updateTask,
);

export default router;
