import type { Request, Response } from "express";
import { routeParam } from "../lib/routeParam.js";
import { addKnowledgeDocument, findKnowledge, getKnowledgeDocuments, removeKnowledgeDocument } from "../services/knowledge.service.js";

export async function getDocuments(req: Request, res: Response) {
  res.json({ documents: await getKnowledgeDocuments(req.workspace!.id, req.user!.id) });
}

export async function postDocument(req: Request, res: Response) {
  const result = await addKnowledgeDocument(req.workspace!.id, req.user!.id, req.body);
  const message = !result.created
    ? "This document is already in the workspace library."
    : result.embeddingStatus === "EMBEDDINGS_READY"
      ? "Document added and indexed for hybrid semantic and full-text search."
      : result.embeddingStatus === "FULL_TEXT_FALLBACK"
        ? "Document added. The embedding provider was unavailable, so full-text search remains active."
        : "Document added. Search is ready with PostgreSQL full-text indexing.";
  res.status(result.created ? 201 : 200).json({ ...result, message });
}

export async function postSearch(req: Request, res: Response) {
  res.json(await findKnowledge(req.workspace!.id, req.user!.id, req.body));
}

export async function deleteDocument(req: Request, res: Response) {
  res.json({ document: await removeKnowledgeDocument(req.workspace!.id, routeParam(req, "documentId"), req.user!.id) });
}
