import dotenv from "dotenv";
dotenv.config();

import "dotenv/config";
import app from "./app.js";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { configureRealtimeAuth, setRealtimeServer } from "./realtime/server.js";
import { prisma } from "./db/prisma.js";

const PORT = process.env.PORT || 5000;

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

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

void start();
