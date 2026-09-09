import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";
import { badRequest } from "../lib/AppError.js";

export function validateBody(schema: ZodSchema): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      throw badRequest("Validation failed");
    }

    next();
  };
}