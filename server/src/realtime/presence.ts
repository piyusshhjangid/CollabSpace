import { ensureRedisConnected } from "../lib/redis.js";

const HEARTBEAT_TTL_MS = 30_000;

function presenceKey(workspaceId: string) {
  return `collabspace:presence:v1:workspace:${workspaceId}`;
}

export async function touchPresence(workspaceId: string, userId: string, socketId: string) {
  const redis = await ensureRedisConnected();
  if (!redis) return null;
  const now = Date.now();
  const key = presenceKey(workspaceId);
  await redis.zadd(key, now, `${userId}:${socketId}`);
  await redis.zremrangebyscore(key, 0, now - HEARTBEAT_TTL_MS);
  await redis.expire(key, 60);
  const ids = await redis.zrangebyscore(key, now - HEARTBEAT_TTL_MS, "+inf");
  return [...new Set(ids.map((id) => String(id).slice(0, String(id).lastIndexOf(":"))))].sort();
}

export async function removePresence(workspaceId: string, userId: string, socketId: string) {
  const redis = await ensureRedisConnected();
  if (!redis) return null;
  const key = presenceKey(workspaceId);
  await redis.zrem(key, `${userId}:${socketId}`);
  const now = Date.now();
  await redis.zremrangebyscore(key, 0, now - HEARTBEAT_TTL_MS);
  const ids = await redis.zrangebyscore(key, now - HEARTBEAT_TTL_MS, "+inf");
  return [...new Set(ids.map((id) => String(id).slice(0, String(id).lastIndexOf(":"))))].sort();
}

export const presenceHeartbeatTtlMs = HEARTBEAT_TTL_MS;
