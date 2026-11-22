const MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
const DIMENSIONS = 768;

export type KnowledgeEmbedding = number[];

function isVector(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === DIMENSIONS && value.every((part) => typeof part === "number" && Number.isFinite(part));
}

export async function embedKnowledgeTexts(texts: string[], taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"): Promise<KnowledgeEmbedding[] | null> {
  const apiKey = process.env.GEMINI_EMBEDDING_API_KEY;
  if (!apiKey || !texts.length) return null;
  const model = MODEL.replace(/^models\//, "");
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:batchEmbedContents`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: `models/${model}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: DIMENSIONS,
      })),
    }),
    signal: AbortSignal.timeout(20_000),
    redirect: "error",
  });
  if (!response.ok) throw new Error(`Embedding provider returned HTTP ${response.status}`);
  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || !Array.isArray((body as { embeddings?: unknown }).embeddings)) {
    throw new Error("Embedding provider returned an invalid response");
  }
  const vectors = (body as { embeddings: Array<{ values?: unknown }> }).embeddings.map((item) => item?.values);
  if (vectors.length !== texts.length || vectors.some((vector) => !isVector(vector))) {
    throw new Error("Embedding provider returned vectors with an unexpected shape");
  }
  return vectors as KnowledgeEmbedding[];
}

export function formatKnowledgeVector(vector: KnowledgeEmbedding) {
  if (!isVector(vector)) throw new Error("Knowledge embedding has an unexpected dimension");
  return `[${vector.join(",")}]`;
}

export function knowledgeEmbeddingsEnabled() {
  return Boolean(process.env.GEMINI_EMBEDDING_API_KEY);
}

export const KNOWLEDGE_EMBEDDING_DIMENSIONS = DIMENSIONS;
