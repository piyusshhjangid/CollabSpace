import { Router } from "express";
import { register, login, refresh, logout } from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validateBody.js";
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/register", validateBody(RegisterSchema), register);
router.post("/login", validateBody(LoginSchema), login);
router.post(
  "/refresh",
  validateBody(RefreshTokenSchema),
  refresh,
);
router.post(
  "/logout",
  validateBody(RefreshTokenSchema),
  logout,
);

export default router;
