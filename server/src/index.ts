import dotenv from "dotenv";
dotenv.config();

import "dotenv/config";
import app from "./app.js";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { configureRealtimeAuth, setRealtimeServer } from "./realtime/server.js";

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] } });
setRealtimeServer(io);
configureRealtimeAuth(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
