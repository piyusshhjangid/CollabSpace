import type { Request, Response, NextFunction } from "express";

import { AppError } from "../lib/AppError.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const requestId = req.requestId ?? "unknown";

  if (err instanceof AppError) {
    return res.status(err.status).json({
      message: err.message,
      requestId,
    });
  }

  console.error(JSON.stringify({
    level: "error",
    requestId,
    name: err instanceof Error ? err.name : "UnknownError",
    message: err instanceof Error ? err.message : "Unexpected error",
  }));

  return res.status(500).json({
    message: "Internal Server Error",
    requestId,
  });
}
