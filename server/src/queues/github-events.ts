import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { redisUrl } from "../lib/redis.js";

export const GITHUB_EVENTS_QUEUE = "github-events";
let queue: Queue | null = null;
let connection: Redis | null = null;

export function getGithubEventsQueue() {
  const url = redisUrl();
  if (!url) return null;
  if (!queue) {
    connection = new Redis(url, { maxRetriesPerRequest: null, lazyConnect: true });
    queue = new Queue(GITHUB_EVENTS_QUEUE, { connection });
  }
  return queue;
}

export async function closeGithubEventsQueue() {
  await queue?.close();
  if (connection) await connection.quit().catch(() => connection?.disconnect());
  queue = null;
  connection = null;
}
