import "dotenv/config";
import { Queue } from "bullmq";
import Redis from "ioredis";

if (!process.env.REDIS_URL) throw new Error("REDIS_URL is required");
const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const queue = new Queue("notifications-dlq", { connection });
try {
  const jobs = await queue.getJobs(["waiting", "active", "delayed", "completed", "failed"], 0, 99, true);
  if (!jobs.length) console.log("Dead-letter queue is empty.");
  for (const job of jobs) {
    console.log(JSON.stringify({ id: job.id, name: job.name, sourceJobId: job.data.sourceJobId, attempts: job.data.attempts, failedAt: job.data.failedAt, reason: job.data.reason, state: await job.getState() }));
  }
} finally {
  await queue.close();
  await connection.quit();
}
