import { createHash } from "node:crypto";
import { badRequest, forbidden, notFound } from "../lib/AppError.js";
import { findWorkspaceMembership } from "../repositories/workspace.repository.js";
import { createKnowledgeDocument as insertKnowledgeDocument, deleteKnowledgeDocument as deleteKnowledgeDocumentRow, findKnowledgeDocumentByHash, knowledgeVectorSearchAvailable, listKnowledgeDocuments, searchKnowledge } from "../repositories/knowledge.repository.js";
import { embedKnowledgeTexts, knowledgeEmbeddingsEnabled } from "../lib/knowledge-embeddings.js";
import { writeAuditLog } from "./audit.service.js";
import { CreateKnowledgeDocumentSchema, SearchKnowledgeSchema } from "../schemas/intelligence.schema.js";

function splitDocument(content: string) {
  const chunks: Array<{ heading: string | null; content: string; embedding?: number[] }> = [];
  let heading: string | null = null;
  let buffer: string[] = [];
  const flush = () => {
    const joined = buffer.join("\n").trim();
    if (!joined) { buffer = []; return; }
    const words = joined.split(/\s+/);
    let part = "";
    for (const word of words) {
      if (part.length + word.length + 1 > 1600 && part) {
        chunks.push({ heading, content: part.trim() });
        part = "";
      }
      part += `${part ? " " : ""}${word}`;
    }
    if (part.trim()) chunks.push({ heading, content: part.trim() });
    buffer = [];
  };
  for (const line of content.replaceAll("\r\n", "\n").split("\n")) {
    const match = line.match(/^\s{0,3}#{1,6}\s+(.+)$/);
    if (match) {
      flush();
      heading = match[1]!.trim().slice(0, 240);
    }
    buffer.push(line);
    if (buffer.join("\n").length >= 1600) flush();
  }
  flush();
  return chunks.slice(0, 100);
}

export async function addKnowledgeDocument(workspaceId: string, userId: string, input: unknown) {
  const parsed = CreateKnowledgeDocumentSchema.parse(input);
  const content = parsed.content.replaceAll("\r\n", "\n").trim();
  const chunks = splitDocument(content);
  if (!chunks.length) throw badRequest("Document did not contain searchable text");
  const contentHash = createHash("sha256").update(content).digest("hex");
  const prior = await findKnowledgeDocumentByHash(workspaceId, contentHash);
  if (prior) return { document: prior, created: false, chunkCount: 0, embeddingStatus: "ALREADY_INDEXED" };
  const vectorReady = await knowledgeVectorSearchAvailable();
  let embeddingStatus = "FULL_TEXT_ONLY";
  if (knowledgeEmbeddingsEnabled() && vectorReady) {
    embeddingStatus = "FULL_TEXT_FALLBACK";
    try {
      const texts = chunks.map((chunk) => `title: ${parsed.title} | heading: ${chunk.heading ?? "none"} | text: ${chunk.content}`);
      const embeddings = await embedKnowledgeTexts(texts, "RETRIEVAL_DOCUMENT");
      if (embeddings) {
        for (const [index, embedding] of embeddings.entries()) chunks[index]!.embedding = embedding;
        embeddingStatus = "EMBEDDINGS_READY";
      }
    } catch {
      // Knowledge remains available through PostgreSQL full-text search if the optional provider is unavailable.
    }
  }
  const saved = await insertKnowledgeDocument({ workspaceId, userId, title: parsed.title, sourceType: parsed.sourceType, sourceUrl: parsed.sourceUrl ?? null, contentHash, content, chunks });
  if (saved.created) await writeAuditLog({ workspaceId, actorId: userId, action: "KNOWLEDGE_DOCUMENT_ADDED", targetType: "KNOWLEDGE_DOCUMENT", targetId: saved.document.id, metadata: { chunkCount: chunks.length, sourceType: parsed.sourceType } });
  return { ...saved, chunkCount: saved.created ? chunks.length : 0, embeddingStatus };
}

export async function getKnowledgeDocuments(workspaceId: string, userId: string) {
  if (!(await findWorkspaceMembership(workspaceId, userId))) throw forbidden("You are not a member of this workspace");
  return listKnowledgeDocuments(workspaceId);
}

export async function findKnowledge(workspaceId: string, userId: string, input: unknown) {
  if (!(await findWorkspaceMembership(workspaceId, userId))) throw forbidden("You are not a member of this workspace");
  const parsed = SearchKnowledgeSchema.parse(input);
  const vectorReady = await knowledgeVectorSearchAvailable();
  let queryEmbedding: number[] | null = null;
  if (vectorReady && knowledgeEmbeddingsEnabled()) {
    try {
      queryEmbedding = (await embedKnowledgeTexts([`task: search result | query: ${parsed.query}`], "RETRIEVAL_QUERY"))?.[0] ?? null;
    } catch {
      // Fall back to the deterministic, workspace-scoped PostgreSQL full-text index.
    }
  }
  const result = await searchKnowledge(workspaceId, parsed.query, parsed.limit, queryEmbedding);
  const retrieval = result.semantic
    ? "Hybrid semantic and full-text search; workspace filtered before ranking"
    : "PostgreSQL full-text search; workspace filtered before ranking";
  return { query: parsed.query, chunks: result.chunks, retrieval };
}

export async function removeKnowledgeDocument(workspaceId: string, documentId: string, userId: string) {
  const deleted = await deleteKnowledgeDocumentRow(workspaceId, documentId);
  if (!deleted) throw notFound("Knowledge document not found");
  await writeAuditLog({ workspaceId, actorId: userId, action: "KNOWLEDGE_DOCUMENT_DELETED", targetType: "KNOWLEDGE_DOCUMENT", targetId: documentId, metadata: {} });
  return { id: documentId };
}
