import { prisma } from "../db/prisma.js";

const SENSITIVE_KEY_PATTERN =
  /(password|passwd|token|secret|authorization|cookie|jwt|refresh|access|api[_-]?key|credential)/i;

const SENSITIVE_VALUE_PATTERN =
  /^(?:Bearer\s+\S+|[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i;

function sanitizeMetadataValue(value: unknown): unknown {
  if (typeof value === "string") {
    return SENSITIVE_VALUE_PATTERN.test(value)
      ? "[REDACTED]"
      : value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeMetadataValue);
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    const result: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      result[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? "[REDACTED]"
        : sanitizeMetadataValue(nestedValue);
    }

    return result;
  }

  return value;
}

export type AuditEntry = {
  workspaceId?: string | null;
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(entry: AuditEntry) {
  const metadata = sanitizeMetadataValue(
    entry.metadata ?? {},
  ) as object;

  return prisma.audit_log.create({
    data: {
      workspace_id: entry.workspaceId ?? null,
      actor_id: entry.actorId ?? null,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId ?? null,
      metadata,
    },
  });
}
