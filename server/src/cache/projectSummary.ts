import { ensureRedisConnected } from "../lib/redis.js";

const SUMMARY_TTL_SECONDS = 30;
const CACHE_FORMAT_VERSION = "v1";

export interface ProjectSummaryCounts {
  TODO: number;
  IN_PROGRESS: number;
  DONE: number;
}

export interface CachedSummary<T> {
  value: T;
  cache: "HIT" | "MISS" | "BYPASS";
  elapsedMs: number;
}

const perfSamples: number[] = [];
const MAX_SAMPLES = 500;
let hitCount = 0;
let missCount = 0;

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
}

function observe(elapsedMs: number) {
  perfSamples.push(elapsedMs);
  if (perfSamples.length > MAX_SAMPLES) perfSamples.shift();
}

export function projectSummaryMetrics() {
  return {
    hits: hitCount,
    misses: missCount,
    hitRatio: hitCount + missCount === 0 ? 0 : hitCount / (hitCount + missCount),
    sampleCount: perfSamples.length,
    p50Ms: percentile(perfSamples, 0.5),
    p95Ms: percentile(perfSamples, 0.95),
  };
}

async function namespaceVersion(workspaceId: string) {
  const redis = await ensureRedisConnected();
  if (!redis) return null;
  const versionKey = `collabspace:summary:${CACHE_FORMAT_VERSION}:workspace:${workspaceId}:version`;
  const version = await redis.get(versionKey);
  return { redis, versionKey, version: version ?? "0" };
}

export async function getProjectSummaryCached<T>(workspaceId: string, projectId: string, load: () => Promise<T>): Promise<CachedSummary<T>> {
  if (process.env.SUMMARY_CACHE_DISABLED === "true") {
    const started = performance.now();
    const value = await load();
    const elapsedMs = performance.now() - started;
    observe(elapsedMs);
    return { value, cache: "BYPASS", elapsedMs };
  }
  const started = performance.now();
  let namespace: Awaited<ReturnType<typeof namespaceVersion>> = null;
  try {
    namespace = await namespaceVersion(workspaceId);
    if (namespace) {
      const key = `collabspace:summary:${CACHE_FORMAT_VERSION}:workspace:${workspaceId}:${namespace.version}:project:${projectId}`;
      const cached = await namespace.redis.get(key);
      if (cached) {
        hitCount++;
        const elapsedMs = performance.now() - started;
        observe(elapsedMs);
        return { value: JSON.parse(cached) as T, cache: "HIT", elapsedMs };
      }
    }
  } catch {
    console.warn("Project summary cache lookup failed; loading from PostgreSQL.");
    namespace = null;
  }

  const value = await load();
  const elapsedMs = performance.now() - started;
  observe(elapsedMs);
  if (!namespace) return { value, cache: "BYPASS", elapsedMs };
  missCount++;
  try {
    const key = `collabspace:summary:${CACHE_FORMAT_VERSION}:workspace:${workspaceId}:${namespace.version}:project:${projectId}`;
    await namespace.redis.set(key, JSON.stringify(value), "EX", SUMMARY_TTL_SECONDS);
  } catch {
    return { value, cache: "BYPASS", elapsedMs };
  }
  return { value, cache: "MISS", elapsedMs };
}

/** Incrementing one workspace generation invalidates every project summary without keyspace scans. */
export async function invalidateProjectSummaries(workspaceId: string) {
  const namespace = await namespaceVersion(workspaceId);
  if (!namespace) return;
  try { await namespace.redis.incr(namespace.versionKey); }
  catch { console.warn("Project summary invalidation failed; entries will expire by TTL."); }
}

