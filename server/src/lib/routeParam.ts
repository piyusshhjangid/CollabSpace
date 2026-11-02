import type { Request } from "express";

export function routeParam(req: Request, key: string): string {
  const value = req.params[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}
