import type { Request, Response, NextFunction } from "express";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log(JSON.stringify({
      level: res.statusCode >= 500 ? "error" : "info",
      timestamp: new Date().toISOString(),
      requestId: req.requestId ?? "unknown",
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
    }));
  });

  next();
}
