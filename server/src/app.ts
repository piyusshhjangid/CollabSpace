import express from "express";
import type { Request, Response } from "express";

const app = express();

app.use(express.json());

interface PingQuery {
  name: string;
}

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
