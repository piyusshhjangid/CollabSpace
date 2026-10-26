import { createHash } from "node:crypto";
import type { RequestHandler } from "express";
import { ensureRedisConnected } from "../lib/redis.js";

const incrementScript = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('PTTL', KEYS[1])
return {count, ttl}
`;

const localCounters = new Map<string, { count: number; expires: number }>();
let lastCleanup = 0;

function safePart(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

async function increment(key: string, windowMs: number) {
  const redis = await ensureRedisConnected();
  if (redis) {
    const result = await redis.eval(incrementScript, 1, key, String(windowMs)) as [number | string, number | string];
    return { count: Number(result[0]), ttl: Math.max(1, Number(result[1])) };
  }
  const now = Date.now();
  if (now - lastCleanup > 60_000) {
    for (const [entryKey, value] of localCounters) if (value.expires <= now) localCounters.delete(entryKey);
    lastCleanup = now;
  }
  const current = localCounters.get(key);
  if (!current || current.expires <= now) {
    localCounters.set(key, { count: 1, expires: now + windowMs });
    return { count: 1, ttl: windowMs };
  }
  current.count++;
  return { count: current.count, ttl: current.expires - now };
}

function incrementLocal(key: string, windowMs: number) {
  const now = Date.now();
  const current = localCounters.get(key);
  if (!current || current.expires <= now) {
    localCounters.set(key, { count: 1, expires: now + windowMs });
    return { count: 1, ttl: windowMs };
  }
  current.count++;
  return { count: current.count, ttl: current.expires - now };
}

export function rateLimit(options: { scope: string; limit: number; windowMs?: number }): RequestHandler {
  const windowMs = options.windowMs ?? 60_000;
  return async (req, res, next) => {
    const ipKey = `collabspace:rate:${options.scope}:ip:${safePart(req.ip || req.socket.remoteAddress || "unknown")}`;
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const keys = [ipKey];
    if (email) keys.push(`collabspace:rate:${options.scope}:identity:${safePart(email)}`);

    try {
      const counts = await Promise.all(keys.map((key) => increment(key, windowMs)));
      const remaining = Math.max(0, options.limit - Math.max(...counts.map((item) => item.count)));
      const resetSeconds = Math.ceil(Math.max(...counts.map((item) => item.ttl)) / 1000);
      res.setHeader("RateLimit-Limit", String(options.limit));
      res.setHeader("RateLimit-Remaining", String(remaining));
      res.setHeader("RateLimit-Reset", String(resetSeconds));
      if (remaining === 0) {
        res.setHeader("Retry-After", String(resetSeconds));
        res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
        return;
      }
      next();
    } catch {
      console.warn("Rate limit store failed; applying the process-local fallback limiter.");
      const cleanupNow = Date.now();
      if (cleanupNow - lastCleanup > 60_000) {
        for (const [entryKey, value] of localCounters) if (value.expires <= cleanupNow) localCounters.delete(entryKey);
        lastCleanup = cleanupNow;
      }
      const fallbackCounts = keys.map((key) => incrementLocal(`fallback:${key}`, windowMs));
      const fallbackRemaining = Math.max(0, options.limit - Math.max(...fallbackCounts.map((entry) => entry.count)));
      const retryAfter = Math.ceil(Math.max(...fallbackCounts.map((entry) => entry.ttl)) / 1000);
      res.setHeader("RateLimit-Limit", String(options.limit));
      res.setHeader("RateLimit-Remaining", String(fallbackRemaining));
      res.setHeader("RateLimit-Reset", String(retryAfter));
      if (!fallbackRemaining) {
        res.setHeader("Retry-After", String(retryAfter));
        res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
        return;
      }
      next();
    }
  };
}

