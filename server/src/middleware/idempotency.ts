import { createHash } from "node:crypto";
import type { RequestHandler, Response } from "express";
import { Prisma } from "../generated/client.js";
import { prisma } from "../db/prisma.js";

let lastCleanup = 0;

function stableHash(req: Parameters<RequestHandler>[0]) {
  return createHash("sha256").update(`${req.method}\n${req.originalUrl}\n${JSON.stringify(req.body ?? {})}`).digest("hex");
}

export const idempotency: RequestHandler = async (req, res, next) => {
  if (Date.now() - lastCleanup > 5 * 60_000) {
    lastCleanup = Date.now();
    void prisma.idempotency_records.deleteMany({ where: { created_at: { lt: new Date(Date.now() - 24 * 60 * 60_000) } } })
      .catch(() => console.warn("Unable to prune expired idempotency records."));
  }
  const key = req.get("Idempotency-Key")?.trim();
  const userId = req.user?.id;
  if (!key) {
    res.status(400).json({ success: false, message: "Idempotency-Key header is required for create requests" });
    return;
  }
  if (!userId) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }
  if (key.length > 200 || key.length < 8) {
    res.status(400).json({ success: false, message: "Idempotency-Key must be between 8 and 200 characters" });
    return;
  }

  const requestHash = stableHash(req);
  let reserved = false;
  try {
    await prisma.idempotency_records.create({ data: { user_id: userId, idempotency_key: key, request_hash: requestHash } });
    reserved = true;
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    const existing = await prisma.idempotency_records.findUnique({ where: { user_id_idempotency_key: { user_id: userId, idempotency_key: key } } });
    if (!existing) throw error;
    if (existing.request_hash !== requestHash) {
      res.status(409).json({ success: false, message: "This Idempotency-Key was already used with a different request" });
      return;
    }
    if (existing.state === "PROCESSING" && existing.created_at.getTime() < Date.now() - 5 * 60_000) {
      await prisma.idempotency_records.deleteMany({ where: { id: existing.id, state: "PROCESSING" } });
      return idempotency(req, res, next);
    }
    if (existing.state !== "COMPLETE" || existing.response_status === null || existing.response_body === null) {
      res.setHeader("Retry-After", "1");
      res.status(409).json({ success: false, message: "A request with this Idempotency-Key is still processing; retry shortly" });
      return;
    }
    res.setHeader("Idempotency-Replayed", "true");
    res.status(existing.response_status).json(existing.response_body);
    return;
  }

  const sendJson = res.json.bind(res);
  let saved = false;
  res.json = ((body: unknown) => {
    const status = res.statusCode;
    if (status >= 500) {
      void prisma.idempotency_records.deleteMany({ where: { user_id: userId, idempotency_key: key, state: "PROCESSING" } })
        .catch(() => console.error("Unable to release a failed idempotency reservation"));
      return sendJson(body);
    }
    const responseBody = JSON.parse(JSON.stringify(body)) as Prisma.InputJsonValue;
    void prisma.idempotency_records.update({
      where: { user_id_idempotency_key: { user_id: userId, idempotency_key: key } },
      data: { state: "COMPLETE", response_status: status, response_body: responseBody },
    }).then(() => {
      saved = true;
      sendJson(body);
    }).catch(() => {
      console.error("Unable to save an idempotent response; returning the original response");
      sendJson(body);
    });
    return res;
  }) as Response["json"];

  res.on("close", () => {
    if (reserved && !saved && !res.writableEnded) {
      void prisma.idempotency_records.deleteMany({ where: { user_id: userId, idempotency_key: key, state: "PROCESSING" } })
        .catch(() => console.error("Unable to release an interrupted idempotency reservation"));
    }
  });
  next();
};

