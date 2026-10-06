import { Router } from "express";

import {
  createInvitation,
  acceptInvitation,
} from "../controllers/invitation.controller.js";

import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validateBody.js";

import {
  CreateInvitationSchema,
  AcceptInvitationSchema,
} from "../schemas/invitation.schema.js";

const router = Router();

router.post(
  "/workspaces/:workspaceId/invitations",
  requireAuth,
  workspaceContext,
  requirePermission("INVITE_MEMBERS"),
  validateBody(CreateInvitationSchema),
  createInvitation,
);

router.post(
  "/invitations/accept",
  requireAuth,
  validateBody(AcceptInvitationSchema),
  acceptInvitation,
);

export default router;
