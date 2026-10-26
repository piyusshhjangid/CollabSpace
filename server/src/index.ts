import dotenv from "dotenv";
dotenv.config();

import "dotenv/config";
import app from "./app.js";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { configureRealtimeAuth, setRealtimeServer } from "./realtime/server.js";
import { prisma } from "./db/prisma.js";
import { Redis } from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { closeRedis, redisUrl } from "./lib/redis.js";

const PORT = process.env.PORT || 5000;
let adapterClients: Redis[] = [];

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] } });
setRealtimeServer(io);
configureRealtimeAuth(io);

async function start() {
  try {
    await prisma.$connect();
  } catch {
    console.error(
      "Could not connect to PostgreSQL. Check DATABASE_URL in server/.env (username, password, host, port, and database).",
    );
    process.exitCode = 1;
    return;
  }

  const url = redisUrl();
  if (url) {
    const pub = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: null, retryStrategy: (attempt) => Math.min(attempt * 500, 5000) });
    const sub = pub.duplicate();
    try {
      await Promise.all([pub.connect(), sub.connect()]);
      io.adapter(createAdapter(pub, sub));
      adapterClients = [pub, sub];
      console.log("Socket.IO Redis adapter enabled.");
    } catch (error) {
      await Promise.all([pub.quit().catch(() => pub.disconnect()), sub.quit().catch(() => sub.disconnect())]);
      console.warn("Socket.IO Redis adapter unavailable; using single-instance delivery.", error instanceof Error ? error.message : "connection failed");
    }
  }

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

void start();

async function shutdown() {
  io.close();
  await Promise.all(adapterClients.map((client) => client.quit().catch(() => client.disconnect())));
  await closeRedis();
  await prisma.$disconnect();
}
process.once("SIGINT", () => { void shutdown().finally(() => process.exit(0)); });
process.once("SIGTERM", () => { void shutdown().finally(() => process.exit(0)); });
