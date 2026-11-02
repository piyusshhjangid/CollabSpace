import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../db/prisma.js";
import { badRequest, conflict, forbidden } from "../lib/AppError.js";
import { findWorkspaceMembership } from "../repositories/workspace.repository.js";
import { getGithubEventsQueue } from "../queues/github-events.js";
import type { GithubIntegrationSchema } from "../schemas/github.schema.js";
import type { z } from "zod";

type IntegrationInput = z.infer<typeof GithubIntegrationSchema>;

export async function listGithubIntegrations(workspaceId: string, userId: string) {
  if (!(await findWorkspaceMembership(workspaceId, userId))) throw forbidden("You are not a member of this workspace");
  return prisma.github_integrations.findMany({ where: { workspace_id: workspaceId }, orderBy: { created_at: "desc" }, select: { id: true, project_id: true, repository: true, enabled: true, created_at: true } });
}

export async function createGithubIntegration(workspaceId: string, userId: string, input: IntegrationInput) {
  const project = await prisma.projects.findFirst({ where: { id: input.projectId, workspace_id: workspaceId }, select: { id: true } });
  if (!project) throw badRequest("Project not found in this workspace");
  const existing = await prisma.github_integrations.findUnique({ where: { repository: input.repository.toLowerCase() } });
  if (existing && existing.workspace_id !== workspaceId) throw conflict("This repository is already connected to another workspace");
  return prisma.github_integrations.upsert({
    where: { repository: input.repository.toLowerCase() },
    create: { workspace_id: workspaceId, project_id: input.projectId, repository: input.repository.toLowerCase(), created_by: userId },
    update: { project_id: input.projectId, enabled: true },
    select: { id: true, project_id: true, repository: true, enabled: true, created_at: true },
  });
}

export async function deleteGithubIntegration(workspaceId: string, integrationId: string) {
  const result = await prisma.github_integrations.deleteMany({ where: { id: integrationId, workspace_id: workspaceId } });
  if (!result.count) throw badRequest("GitHub integration not found");
  return { id: integrationId };
}

export async function receiveGithubWebhook(raw: Buffer, signature: string | undefined, deliveryId: string | undefined, eventType: string | undefined, payload: unknown) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) throw new Error("GitHub webhook endpoint is not configured");
  if (!signature || !/^sha256=[a-f0-9]{64}$/i.test(signature)) throw forbidden("Invalid webhook signature");
  const expected = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) throw forbidden("Invalid webhook signature");
  if (!deliveryId || deliveryId.length > 100 || !/^[A-Za-z0-9-]+$/.test(deliveryId)) throw badRequest("Invalid delivery identifier");
  if (!eventType || eventType.length > 80) throw badRequest("Invalid GitHub event type");
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw badRequest("Invalid webhook payload");
  const value = payload as Record<string, unknown>;
  const repository = value.repository && typeof value.repository === "object" ? (value.repository as Record<string, unknown>).full_name : null;
  if (typeof repository !== "string" || repository.length > 255) throw badRequest("Webhook repository is missing");
  const integration = await prisma.github_integrations.findFirst({ where: { repository: repository.toLowerCase(), enabled: true }, select: { id: true } });
  if (!integration) return { accepted: true, ignored: true };
  const queue = getGithubEventsQueue();
  if (!queue) throw new Error("GitHub event processing requires REDIS_URL and the GitHub worker");

  const result = await prisma.github_webhook_deliveries.createMany({
    data: [{ delivery_id: deliveryId, repository: repository.toLowerCase(), event_type: eventType, payload: value as never }],
    skipDuplicates: true,
  });
  if (!result.count) {
    const prior = await prisma.github_webhook_deliveries.findUnique({ where: { delivery_id: deliveryId }, select: { status: true } });
    if (prior?.status === "PROCESSED" || prior?.status === "IGNORED") return { accepted: true, duplicate: true };
  }
  try {
    await queue.add("process-delivery", { deliveryId }, { jobId: `github-${deliveryId}`, attempts: 8, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: { age: 7 * 24 * 60 * 60, count: 5000 }, removeOnFail: false });
    await prisma.github_webhook_deliveries.update({ where: { delivery_id: deliveryId }, data: { status: "QUEUED", error_code: null } });
  } catch (error) {
    await prisma.github_webhook_deliveries.update({ where: { delivery_id: deliveryId }, data: { status: "RETRY", error_code: "QUEUE_UNAVAILABLE" } }).catch(() => undefined);
    throw error;
  }
  return { accepted: true, queued: true };
}
