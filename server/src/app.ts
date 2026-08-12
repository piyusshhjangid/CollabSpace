import express from "express";
import type { Request, Response } from "express";
import workspaceRouter from "./routes/workspace.routes.js";
import projectRouter from "./routes/project.routes.js";
import taskRouter from "./routes/task.routes.js"
import { requestLogger } from "./middleware/requestLogger.js";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(requestLogger);
app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

interface PingQuery {
  name: string;
}

app.use("/api/workspaces", workspaceRouter);
app.use("/api/workspaces/:workspaceId/projects", projectRouter);
app.use("/api/projects/:projectId/tasks", taskRouter)

app.use(errorHandler)

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "CollabSpace Backend Running",
  });
});

app.get("/api/ping", (req: Request<{}, {}, {}, PingQuery>, res: Response) => {
  const name = req.query.name || "Guest";

  res.json({
    message: `Hello ${name}`,
  });
});

export default app;
