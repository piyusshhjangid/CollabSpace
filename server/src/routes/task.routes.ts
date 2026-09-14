import { Router } from "express";
import { createTask, getTasks } from "../controllers/task.controller.js";
import { validateBody } from "../middleware/validateBody.js";
import { CreateTaskSchema } from "../schemas/task.schema.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router({
  mergeParams: true,
});

router.get("/", requireAuth, getTasks);

router.post("/", requireAuth, validateBody(CreateTaskSchema), createTask);

export default router;
