import "dotenv/config";
import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import nodemailer from "nodemailer";
import { prisma } from "../db/prisma.js";
import { redisUrl } from "../lib/redis.js";
import type { InvitationEmailJob } from "../queues/notifications.js";

const url = redisUrl();
if (!url) throw new Error("REDIS_URL is required to run the notification worker");
if (!process.env.SMTP_HOST || !process.env.EMAIL_FROM) throw new Error("SMTP_HOST and EMAIL_FROM are required to run the notification worker");

const connection = new Redis(url, { maxRetriesPerRequest: null });
const deadLetters = new Queue("notifications-dlq", { connection: connection.duplicate() });
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
});

const worker = new Worker<InvitationEmailJob>("notifications", async (job) => {
  const invitation = await prisma.invitations.findUnique({ where: { id: job.data.invitationId }, select: { email_sent_at: true, expires_at: true, accepted_at: true } });
  if (!invitation || invitation.email_sent_at || invitation.accepted_at || invitation.expires_at <= new Date()) return { skipped: true };
  const appUrl = (process.env.APP_BASE_URL || "http://localhost:5173").replace(/\/$/, "");
  const inviteUrl = `${appUrl}/onboarding?token=${encodeURIComponent(job.data.token)}`;
  const messageId = `<collabspace-invitation-${job.data.invitationId}@collabspace.local>`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: job.data.email,
    messageId,
    subject: `Join ${job.data.workspaceName} on CollabSpace`,
    text: `You have been invited to ${job.data.workspaceName}. Accept your invitation: ${inviteUrl}`,
    html: `<p>You have been invited to <strong>${escapeHtml(job.data.workspaceName)}</strong> on CollabSpace.</p><p><a href="${inviteUrl}">Accept invitation</a></p><p>This invitation expires after 24 hours.</p>`,
  });
  await prisma.invitations.updateMany({ where: { id: job.data.invitationId, email_sent_at: null }, data: { email_sent_at: new Date() } });
  return { sent: true };
}, { connection, concurrency: 5 });

worker.on("completed", (job) => console.log(`Notification job ${job.id} completed.`));
worker.on("failed", async (job, error) => {
  console.error(`Notification job ${job?.id ?? "unknown"} failed (${job?.attemptsMade ?? 0}/${job?.opts.attempts ?? 0}): ${error.message}`);
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    await deadLetters.add("failed-notification", {
      sourceJobId: job.id,
      kind: job.name,
      attempts: job.attemptsMade,
      failedAt: new Date().toISOString(),
      reason: error.message.slice(0, 500),
    }, { jobId: `dead-${job.id}`, removeOnComplete: false });
    console.error(`Notification job ${job.id} moved to notifications-dlq.`);
  }
});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

console.log("Notification worker ready.");
async function shutdown() {
  await worker.close();
  await deadLetters.close();
  await connection.quit();
  await prisma.$disconnect();
}
process.once("SIGINT", () => { void shutdown().finally(() => process.exit(0)); });
process.once("SIGTERM", () => { void shutdown().finally(() => process.exit(0)); });
