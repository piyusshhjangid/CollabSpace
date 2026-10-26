import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { redisUrl } from "../lib/redis.js";

export interface InvitationEmailJob {
  invitationId: string;
  email: string;
  workspaceName: string;
  token: string;
}

let queue: Queue<InvitationEmailJob> | null = null;

function getQueue() {
  const url = redisUrl();
  if (!url || !process.env.SMTP_HOST) return null;
  if (!queue) queue = new Queue<InvitationEmailJob>("notifications", {
    connection: new Redis(url, { maxRetriesPerRequest: null }),
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 1_000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 500 },
    },
  });
  return queue;
}

export async function enqueueInvitationEmail(data: InvitationEmailJob) {
  const notifications = getQueue();
  if (!notifications) return false;
  await notifications.add("invitation-email", data, { jobId: `invitation-${data.invitationId}` });
  return true;
}

export async function closeNotificationQueue() {
  await queue?.close();
  queue = null;
}
