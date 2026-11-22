import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validateBody.js";
import { CreateKnowledgeDocumentSchema, SearchKnowledgeSchema } from "../schemas/intelligence.schema.js";
import { deleteDocument, getDocuments, postDocument, postSearch } from "../controllers/knowledge.controller.js";

const router = Router();
const base = "/workspaces/:workspaceId/knowledge";
router.get(`${base}/documents`, requireAuth, workspaceContext, getDocuments);
router.post(`${base}/documents`, requireAuth, workspaceContext, requirePermission("MANAGE_OUTCOMES"), validateBody(CreateKnowledgeDocumentSchema), postDocument);
router.delete(`${base}/documents/:documentId`, requireAuth, workspaceContext, requirePermission("MANAGE_OUTCOMES"), deleteDocument);
router.post(`${base}/search`, requireAuth, workspaceContext, validateBody(SearchKnowledgeSchema), postSearch);

export default router;
