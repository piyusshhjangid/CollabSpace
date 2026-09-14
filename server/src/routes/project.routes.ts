import { Router } from "express";
import {
  getProjects,
  createProject,
} from "../controllers/project.controller.js";
import { validateBody } from "../middleware/validateBody.js";
import { CreateProjectSchema } from "../schemas/project.schema.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router({
  mergeParams: true,
});

router.get("/", requireAuth, getProjects);

router.post("/", requireAuth, validateBody(CreateProjectSchema), createProject);

export default router;
