import { badRequest } from "../lib/AppError.js";

export interface TaskCursor {
  createdAt: string;
  id: string;
}

export function encodeTaskCursor(cursor: TaskCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeTaskCursor(value: string): TaskCursor {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<TaskCursor>;

    if (
      typeof parsed.createdAt !== "string" ||
      typeof parsed.id !== "string"
    ) {
      throw new Error("Invalid cursor");
    }

    const date = new Date(parsed.createdAt);

    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid cursor date");
    }

    return {
      createdAt: date.toISOString(),
      id: parsed.id,
    };
  } catch {
    throw badRequest("Invalid pagination cursor");
  }
}
