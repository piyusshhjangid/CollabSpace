import { Router } from "express";
import { createTask, getTasks } from "../controllers/task.controller.js";
import { validateBody } from "../middleware/validateBody.js";
import { CreateTaskSchema } from "../schemas/task.schema.js";

const router = Router({
  mergeParams: true,
});

router.get("/", getTasks);
router.post("/", validateBody(CreateTaskSchema), createTask);


export default router;
