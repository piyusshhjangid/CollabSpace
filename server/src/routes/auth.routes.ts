import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validateBody.js";
import { RegisterSchema, LoginSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/register", validateBody(RegisterSchema), register);
router.post("/login", validateBody(LoginSchema), login);

export default router;
