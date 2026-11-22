import { prisma } from "../db/prisma.js";
import { formatKnowledgeVector, type KnowledgeEmbedding } from "../lib/knowledge-embeddings.js";

export async function listKnowledgeDocuments(workspaceId: string) {
  return prisma.$queryRaw<Array<{ id: string; title: string; source_type: string; source_url: string | null; content_hash: string; created_at: Date; updated_at: Date; chunk_count: number }>>`
    SELECT d.id, d.title, d.source_type, d.source_url, d.content_hash, d.created_at, d.updated_at,
      (SELECT count(*)::int FROM knowledge_chunks c WHERE c.document_id = d.id AND c.workspace_id = d.workspace_id) AS chunk_count
    FROM knowledge_documents d WHERE d.workspace_id = ${workspaceId}::uuid
    ORDER BY d.updated_at DESC LIMIT 100
  `;
}

export async function knowledgeVectorSearchAvailable() {
  const rows = await prisma.$queryRaw<Array<{ available: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM pg_attribute
      WHERE attrelid = 'knowledge_chunks'::regclass AND attname = 'embedding_vector' AND NOT attisdropped
    ) AS available
  `;
  return rows[0]?.available === true;
}

export async function findKnowledgeDocumentByHash(workspaceId: string, contentHash: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string; title: string; created_at: Date }>>`
    SELECT id, title, created_at FROM knowledge_documents
    WHERE workspace_id = ${workspaceId}::uuid AND content_hash = ${contentHash} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function createKnowledgeDocument(input: { workspaceId: string; userId: string; title: string; sourceType: string; sourceUrl: string | null; contentHash: string; content: string; chunks: Array<{ heading: string | null; content: string; embedding?: KnowledgeEmbedding }> }) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string; title: string; created_at: Date }>>`
      INSERT INTO knowledge_documents (workspace_id, created_by, title, source_type, source_url, content_hash, content)
      VALUES (${input.workspaceId}::uuid, ${input.userId}::uuid, ${input.title}, ${input.sourceType}, ${input.sourceUrl}, ${input.contentHash}, ${input.content})
      ON CONFLICT (workspace_id, content_hash) DO NOTHING
      RETURNING id, title, created_at
    `;
    const document = rows[0];
    if (!document) {
      const existing = await tx.$queryRaw<Array<{ id: string; title: string; created_at: Date }>>`
        SELECT id, title, created_at FROM knowledge_documents
        WHERE workspace_id = ${input.workspaceId}::uuid AND content_hash = ${input.contentHash} LIMIT 1
      `;
      if (!existing[0]) throw new Error("Knowledge document conflict could not be resolved");
      return { document: existing[0], created: false };
    }
    const vectorColumn = await tx.$queryRaw<Array<{ available: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid = 'knowledge_chunks'::regclass AND attname = 'embedding_vector' AND NOT attisdropped
      ) AS available
    `;
    for (const [index, chunk] of input.chunks.entries()) {
      const inserted = await tx.$queryRaw<Array<{ id: string }>>`
        INSERT INTO knowledge_chunks (workspace_id, document_id, chunk_index, heading, content, embedding)
        VALUES (${input.workspaceId}::uuid, ${document.id}::uuid, ${index}, ${chunk.heading}, ${chunk.content}, ${chunk.embedding ? JSON.stringify(chunk.embedding) : null}::jsonb)
        RETURNING id
      `;
      if (vectorColumn[0]?.available && chunk.embedding) {
        const vector = formatKnowledgeVector(chunk.embedding);
        await tx.$executeRaw`
          UPDATE knowledge_chunks SET embedding_vector = ${vector}::vector
          WHERE id = ${inserted[0]!.id}::uuid AND workspace_id = ${input.workspaceId}::uuid
        `;
      }
    }
    return { document, created: true };
  });
}

export async function searchKnowledge(workspaceId: string, query: string, limit: number, queryEmbedding?: KnowledgeEmbedding | null) {
  const vectorColumn = await prisma.$queryRaw<Array<{ available: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM pg_attribute
      WHERE attrelid = 'knowledge_chunks'::regclass AND attname = 'embedding_vector' AND NOT attisdropped
    ) AS available
  `;
  if (queryEmbedding && vectorColumn[0]?.available) {
    const vector = formatKnowledgeVector(queryEmbedding);
    const chunks = await prisma.$queryRaw<Array<{ chunk_id: string; document_id: string; title: string; source_type: string; source_url: string | null; heading: string | null; snippet: string; rank: number }>>`
      WITH search_query AS (
        SELECT plainto_tsquery('english', ${query}) AS query
      ), candidates AS (
        SELECT c.id AS chunk_id, d.id AS document_id, d.title, d.source_type, d.source_url, c.heading,
          left(c.content, 1800) AS snippet,
          CASE WHEN c.search_vector @@ q.query THEN ts_rank_cd(c.search_vector, q.query) ELSE 0 END AS lexical_score,
          CASE WHEN c.embedding_vector IS NOT NULL THEN 1 - (c.embedding_vector <=> ${vector}::vector) ELSE NULL END AS semantic_score
        FROM knowledge_chunks c
        JOIN knowledge_documents d ON d.id = c.document_id AND d.workspace_id = c.workspace_id
        CROSS JOIN search_query q
        WHERE c.workspace_id = ${workspaceId}::uuid AND d.workspace_id = ${workspaceId}::uuid
          AND (c.embedding_vector IS NOT NULL OR c.search_vector @@ q.query)
      ), ranked AS (
        SELECT *, CASE WHEN semantic_score IS NULL
          THEN 1 - exp(-5 * lexical_score)
          ELSE ((semantic_score + 1) / 2) * 0.75 + (1 - exp(-5 * lexical_score)) * 0.25
        END AS score
        FROM candidates
      )
      SELECT chunk_id, document_id, title, source_type, source_url, heading, snippet, score AS rank
      FROM ranked ORDER BY score DESC, title ASC LIMIT ${limit}
    `;
    return { chunks, semantic: true };
  }
  const chunks = await prisma.$queryRaw<Array<{ chunk_id: string; document_id: string; title: string; source_type: string; source_url: string | null; heading: string | null; snippet: string; rank: number }>>`
    SELECT c.id AS chunk_id, d.id AS document_id, d.title, d.source_type, d.source_url, c.heading,
      left(c.content, 1800) AS snippet, ts_rank_cd(c.search_vector, plainto_tsquery('english', ${query})) AS rank
    FROM knowledge_chunks c JOIN knowledge_documents d ON d.id = c.document_id AND d.workspace_id = c.workspace_id
    WHERE c.workspace_id = ${workspaceId}::uuid AND d.workspace_id = ${workspaceId}::uuid
      AND c.search_vector @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC, d.created_at DESC LIMIT ${limit}
  `;
  return { chunks, semantic: false };
}

export async function deleteKnowledgeDocument(workspaceId: string, documentId: string) {
  return prisma.$executeRaw`DELETE FROM knowledge_documents WHERE id = ${documentId}::uuid AND workspace_id = ${workspaceId}::uuid`;
}
