const baseUrl = (process.env.BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const workspaceId = process.env.WORKSPACE_ID;
const projectId = process.env.PROJECT_ID;
const token = process.env.ACCESS_TOKEN;
const iterations = Math.max(1, Number(process.env.ITERATIONS || 100));
const warmup = Math.max(0, Number(process.env.WARMUP || 5));
if (!workspaceId || !projectId || !token) throw new Error("Set WORKSPACE_ID, PROJECT_ID, and ACCESS_TOKEN before benchmarking.");

const url = `${baseUrl}/api/projects/${encodeURIComponent(projectId)}/summary?workspaceId=${encodeURIComponent(workspaceId)}`;
const samples = [];
let hits = 0;
let misses = 0;
for (let i = 0; i < warmup + iterations; i += 1) {
  const started = performance.now();
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const elapsedMs = performance.now() - started;
  if (!response.ok) throw new Error(`Summary request failed (${response.status}): ${await response.text()}`);
  await response.arrayBuffer();
  const cache = response.headers.get("x-summary-cache");
  if (i >= warmup) {
    samples.push(elapsedMs);
    if (cache === "HIT") hits += 1;
    if (cache === "MISS") misses += 1;
  }
}
samples.sort((a, b) => a - b);
const percentile = (p) => Number(samples[Math.min(samples.length - 1, Math.ceil(p * samples.length) - 1)]?.toFixed(2) || 0);
const report = {
  capturedAt: new Date().toISOString(),
  mode: process.env.SUMMARY_CACHE_DISABLED === "true" ? "postgres-baseline" : "redis-cache",
  iterations,
  warmup,
  p50Ms: percentile(0.5),
  p95Ms: percentile(0.95),
  cacheHits: hits,
  cacheMisses: misses,
  hitRatio: hits + misses ? Number((hits / (hits + misses)).toFixed(4)) : null,
};
const json = JSON.stringify(report, null, 2);
console.log(json);
if (process.env.RESULT_FILE) await (await import("node:fs/promises")).writeFile(process.env.RESULT_FILE, `${json}\n`, "utf8");
