import { Router } from "express";
import { createTask, getTasks } from "../controllers/task.controller.js";

const router = Router({
  mergeParams: true,
});

router.get('/', getTasks)

router.post("/", createTask);

export default router;
