import type { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";

let io: Server | undefined;

export function setRealtimeServer(server: Server) { io = server; }
export function workspaceRoom(workspaceId: string) { return `workspace:${workspaceId}`; }

export async function publishExecutionEvent(workspaceId: string, resource: "task" | "dependency", action: "created" | "updated" | "deleted", id: string) {
  const counter = await prisma.workspace_event_counters.upsert({
    where: { workspace_id: workspaceId },
    create: { workspace_id: workspaceId, sequence: 1n },
    update: { sequence: { increment: 1n } },
    select: { sequence: true },
  });
  const event = { sequence: Number(counter.sequence), resource, action, id };
  io?.to(workspaceRoom(workspaceId)).emit("execution:event", event);
  return event;
}

export function configureRealtimeAuth(server: Server) {
  server.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const secret = process.env.JWT_SECRET;
    if (typeof token !== "string" || !secret) return next(new Error("Authentication required"));
    try {
      const decoded = jwt.verify(token, secret);
      if (typeof decoded === "string" || typeof decoded.sub !== "string") return next(new Error("Invalid token"));
      socket.data.userId = decoded.sub;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  server.on("connection", (socket) => {
    const joined = new Set<string>();
    socket.on("workspace:join", async (payload: unknown, acknowledge?: (result: { ok: boolean; sequence?: number; message?: string }) => void) => {
      const workspaceId = payload && typeof payload === "object" && "workspaceId" in payload ? (payload as { workspaceId?: unknown }).workspaceId : undefined;
      if (typeof workspaceId !== "string" || !/^[0-9a-f-]{36}$/i.test(workspaceId)) {
        acknowledge?.({ ok: false, message: "Invalid workspace" });
        return;
      }
      const membership = await prisma.workspace_members.findFirst({ where: { workspace_id: workspaceId, user_id: socket.data.userId }, select: { id: true } });
      if (!membership) {
        acknowledge?.({ ok: false, message: "Workspace access denied" });
        return;
      }
      await socket.join(workspaceRoom(workspaceId));
      joined.add(workspaceId);
      const counter = await prisma.workspace_event_counters.findUnique({ where: { workspace_id: workspaceId }, select: { sequence: true } });
      acknowledge?.({ ok: true, sequence: Number(counter?.sequence ?? 0) });
    });
    socket.on("workspace:leave", (payload: unknown) => {
      const workspaceId = payload && typeof payload === "object" && "workspaceId" in payload ? (payload as { workspaceId?: unknown }).workspaceId : undefined;
      if (typeof workspaceId !== "string" || !joined.delete(workspaceId)) return;
      void socket.leave(workspaceRoom(workspaceId));
    });
  });
}
