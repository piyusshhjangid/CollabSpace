import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { unauthorized } from "../lib/AppError.js";

interface JwtPayload {
  sub: string;
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw unauthorized("Authentication required");
  }

  const token = authHeader.substring(7);

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded.sub) {
      throw unauthorized("Invalid token");
    }

    req.user = {
      id: decoded.sub,
    };

    next();
  } catch {
    throw unauthorized("Invalid or expired token");
  }
};