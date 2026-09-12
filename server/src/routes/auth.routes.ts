import { Router } from "express";
import { register } from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validateBody.js";
import { RegisterSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post(
  "/register",
  validateBody(RegisterSchema),
  register,
);

export default router;