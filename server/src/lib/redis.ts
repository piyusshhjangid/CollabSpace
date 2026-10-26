import { Redis } from "ioredis";

let client: Redis | null = null;
let connecting: Promise<Redis> | null = null;
let redisAvailable = false;

export function redisUrl() {
  return process.env.REDIS_URL?.trim() || null;
}

export function getRedisClient(): Redis | null {
  const url = redisUrl();
  if (!url) return null;
  if (!client) {
    client = new Redis(url, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => Math.min(attempt * 250, 3000),
      connectTimeout: 1500,
    });
    client.on("ready", () => { redisAvailable = true; });
    client.on("end", () => { redisAvailable = false; });
    client.on("error", () => {
      if (redisAvailable) console.warn("Redis unavailable; cache, rate limits, presence, and realtime fanout are degraded.");
      redisAvailable = false;
    });
  }
  return client;
}

export async function ensureRedisConnected() {
  const redis = getRedisClient();
  if (!redis) return null;
  if (redis.status === "ready") return redis;
  if (!connecting) {
    connecting = (async () => {
      if (redis.status === "wait") await redis.connect();
      else {
        for (let attempt = 0; attempt < 10 && redis.status !== "ready"; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      if (redis.status !== "ready") throw new Error("Redis connection unavailable");
      return redis;
    })().finally(() => { connecting = null; });
  }
  try { return await connecting; } catch { return null; }
}

export async function closeRedis() {
  if (!client) return;
  const current = client;
  client = null;
  connecting = null;
  redisAvailable = false;
  await current.quit().catch(() => current.disconnect());
}

