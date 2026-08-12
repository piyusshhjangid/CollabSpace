import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { badRequest } from "../lib/AppError.js";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      throw badRequest("Validation failed");
    }

    next();
  };
}
