import { Router } from "express";
import {
  getProjects,
  createProject,
} from "../controllers/project.controller.js";
import { validateBody } from "../middleware/validateBody.js";
import { CreateProjectSchema } from "../schemas/project.schema.js";

const router = Router({
  mergeParams: true,
});

router.get("/", getProjects);

router.post("/", validateBody(CreateProjectSchema), createProject);

export default router;
