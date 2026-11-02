import express from "express";
import type { Request, Response } from "express";
import workspaceRouter from "./routes/workspace.routes.js";
import projectRouter from "./routes/project.routes.js";
import taskRouter from "./routes/task.routes.js"
import { requestLogger } from "./middleware/requestLogger.js";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import projectSummaryRouter from "./routes/project-summary.routes.js";
import authRouter from "./routes/auth.routes.js";
import invitationRouter from "./routes/invitation.routes.js";
import { requestId } from "./middleware/requestId.js";
import deliveryHealthRouter from "./routes/delivery-health.routes.js";
import aiRouter from "./routes/ai.routes.js";
import { prisma } from "./db/prisma.js";
import executionRouter from "./routes/execution.routes.js";
import graphRouter from "./routes/graph.routes.js";
import githubIntegrationsRouter, { githubWebhookRouter } from "./routes/github.routes.js";

const app = express();
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

app.use(requestId);
app.use(requestLogger);
// GitHub's HMAC is calculated over the exact request bytes, so this route must run before JSON parsing.
app.use("/integrations/github", githubWebhookRouter);
app.use(
  express.json({
    limit: "1mb",
  }),
);

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)), methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"] }));

interface PingQuery {
  name: string;
}

app.use("/api/projects", projectSummaryRouter);
app.use("/api", executionRouter);
app.use("/api", graphRouter);
app.use("/api", githubIntegrationsRouter);
app.use("/api", deliveryHealthRouter);
app.use("/api", aiRouter);
app.use("/api/workspaces", workspaceRouter);
app.use("/api/workspaces/:workspaceId/projects", projectRouter);
app.use("/api/projects/:projectId/tasks", taskRouter)
app.use("/auth", authRouter);
app.use("/api", invitationRouter);

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "CollabSpace Backend Running",
  });
});

app.get("/health/live", (_req: Request, res: Response) => res.json({ status: "ok" }));
app.get("/health/ready", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready", dependencies: { postgres: "ok" } });
  } catch {
    res.status(503).json({ status: "not_ready", dependencies: { postgres: "unavailable" } });
  }
});

app.get("/api/ping", (req: Request<{}, {}, {}, PingQuery>, res: Response) => {
  const name = req.query.name || "Guest";

  res.json({
    message: `Hello ${name}`,
  });
});

app.use(errorHandler);

export default app;
//made by piyush with love 
