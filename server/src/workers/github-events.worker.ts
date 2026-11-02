import "dotenv/config";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { prisma } from "../db/prisma.js";
import { redisUrl } from "../lib/redis.js";
import { GITHUB_EVENTS_QUEUE } from "../queues/github-events.js";
import { classifyGithubEvidence, reconcileWorkspaceTruth, reconcileTaskTruth } from "../services/execution-truth.service.js";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj => value && typeof value === "object" && !Array.isArray(value) ? value as Obj : {};
const str = (value: unknown) => typeof value === "string" ? value : "";
const url = (value: unknown) => typeof value === "string" && /^https:\/\//i.test(value) ? value : null;

async function processDelivery(deliveryId: string) {
  const delivery = await prisma.github_webhook_deliveries.findUnique({ where: { delivery_id: deliveryId } });
  if (!delivery || delivery.status === "PROCESSED" || delivery.status === "IGNORED") return;
  const integration = await prisma.github_integrations.findFirst({ where: { repository: delivery.repository, enabled: true } });
  if (!integration) {
    await prisma.github_webhook_deliveries.update({ where: { delivery_id: deliveryId }, data: { status: "IGNORED", processed_at: new Date(), payload: {} } });
    return;
  }

  const payload = obj(delivery.payload);
  const sender = obj(payload.sender);
  const pull = obj(payload.pull_request);
  const review = obj(payload.review);
  const check = obj(payload.check_run);
  const workflow = obj(payload.workflow_run);
  const issue = obj(payload.issue);
  const deployment = obj(payload.deployment_status);
  const commits = Array.isArray(payload.commits) ? payload.commits.map(obj) : [];
  const head = obj(pull.head);
  const repo = obj(payload.repository);
  const action = str(payload.action) || null;
  const merged = pull.merged === true;
  const conclusion = str(check.conclusion || workflow.conclusion);
  const state = str(review.state || deployment.state || payload.state);
  const title = str(pull.title || check.name || workflow.name || issue.title || deployment.environment || payload.ref || repo.full_name || delivery.event_type);
  const message = commits.map((commit) => str(commit.message)).filter(Boolean).join("\n").slice(0, 4000);
  const body = str(pull.body || issue.body || review.body || (message || null) || null).slice(0, 6000) || null;
  const branch = str(head.ref || payload.ref).replace(/^refs\/heads\//, "") || null;
  const htmlUrl = url(pull.html_url || check.html_url || workflow.html_url || issue.html_url || payload.compare || payload.html_url);
  const occurredRaw = str(pull.updated_at || check.completed_at || workflow.updated_at || issue.updated_at || deployment.created_at || obj(commits.at(-1)).timestamp);
  const occurredAt = occurredRaw && Number.isFinite(Date.parse(occurredRaw)) ? new Date(occurredRaw) : delivery.received_at;
  const searchText = [title, body, branch, message].filter(Boolean).join(" ");
  const taskRef = searchText.match(/\b(?:CS-[A-F0-9]{8,16}|[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\b/i)?.[0];
  const task = taskRef ? await prisma.tasks.findFirst({ where: { workspace_id: integration.workspace_id, project_id: integration.project_id, OR: [{ id: taskRef }, { task_key: taskRef.toUpperCase() }] }, select: { id: true } }) : null;
  const eventMetadata = { repository: delivery.repository, action, merged, state, conclusion, branch, commitCount: commits.length };

  const event = await prisma.execution_events.upsert({
    where: { source_external_id: { source: "GITHUB", external_id: deliveryId } },
    create: { workspace_id: integration.workspace_id, project_id: integration.project_id, task_id: task?.id ?? null, integration_id: integration.id, source: "GITHUB", external_id: deliveryId, event_type: delivery.event_type, action, actor: str(sender.login) || null, title, body, url: htmlUrl, branch, occurred_at: occurredAt, link_confidence: task ? 0.95 : 0, metadata: eventMetadata },
    update: {},
  });
  if (task) {
    const signal = classifyGithubEvidence(delivery.event_type, action, eventMetadata);
    if (signal) {
      await prisma.task_evidence.createMany({ data: [{ workspace_id: integration.workspace_id, project_id: integration.project_id, task_id: task.id, event_id: event.id, evidence_type: signal.type, observed_status: signal.status, confidence: task ? 0.95 : 0.55, explanation: signal.explanation, provenance: { source: "github", repository: delivery.repository, deliveryId, url: htmlUrl, actor: str(sender.login) || null }, captured_at: occurredAt }], skipDuplicates: true });
      await reconcileTaskTruth(task.id);
    }
  }
  await prisma.github_webhook_deliveries.update({ where: { delivery_id: deliveryId }, data: { status: "PROCESSED", processed_at: new Date(), error_code: null, payload: {} } });
  return { workspaceId: integration.workspace_id };
}

const redis = redisUrl();
if (!redis) throw new Error("REDIS_URL is required to run the GitHub webhook worker");
const connection = new Redis(redis, { maxRetriesPerRequest: null });
const worker = new Worker(GITHUB_EVENTS_QUEUE, async (job) => processDelivery(String(job.data.deliveryId)), { connection, concurrency: 5 });
worker.on("failed", async (job) => {
  if (!job?.data?.deliveryId) return;
  const attempts = job.attemptsMade;
  await prisma.github_webhook_deliveries.update({ where: { delivery_id: String(job.data.deliveryId) }, data: { status: attempts >= (job.opts.attempts ?? 1) ? "FAILED" : "RETRY", error_code: "PROCESSING_FAILED" } }).catch(() => undefined);
});

let reconciling = false;
async function reconcile() {
  if (reconciling) return;
  reconciling = true;
  try {
    const workspaces = await prisma.workspaces.findMany({ select: { id: true } });
    for (const workspace of workspaces) await reconcileWorkspaceTruth(workspace.id);
  } catch (error) {
    console.error("Scheduled truth reconciliation failed", error instanceof Error ? error.message : "unknown error");
  } finally {
    reconciling = false;
  }
}
void reconcile();
const reconciliationTimer = setInterval(() => void reconcile(), 15 * 60 * 1000);
console.log("GitHub event worker ready; truth reconciliation runs every 15 minutes.");

async function shutdown() {
  clearInterval(reconciliationTimer);
  await worker.close();
  await connection.quit();
  await prisma.$disconnect();
}
process.once("SIGINT", () => { void shutdown().finally(() => process.exit(0)); });
process.once("SIGTERM", () => { void shutdown().finally(() => process.exit(0)); });
