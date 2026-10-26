import { Router } from "express";
import { register, login, refresh, logout } from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validateBody.js";
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from "../schemas/auth.schema.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();

router.post("/register", rateLimit({ scope: "register", limit: 5 }), validateBody(RegisterSchema), register);
router.post("/login", rateLimit({ scope: "login", limit: 10 }), validateBody(LoginSchema), login);
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
