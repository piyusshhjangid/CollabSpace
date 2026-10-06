import { describe, expect, it } from "vitest";
import { prisma } from "../../src/db/prisma.js";
import { writeAuditLog } from "../../src/services/audit.service.js";

describe("audit log security", () => {
  it("redacts sensitive keys recursively", async () => {
    const row = await writeAuditLog({
      action: "TEST_SENSITIVE_KEYS",
      targetType: "TEST",
      targetId: "target-1",
      metadata: {
        password: "super-secret-password",
        nested: {
          accessToken: "super-secret-access",
          refreshToken: "super-secret-refresh",
          safe: "visible",
        },
        items: [
          {
            apiKey: "super-secret-api-key",
            value: "safe-value",
          },
        ],
      },
    });

    const stored = await prisma.audit_log.findUnique({
      where: { id: row.id },
    });

    expect(stored).not.toBeNull();
    expect(stored?.metadata).toEqual({
      password: "[REDACTED]",
      nested: {
        accessToken: "[REDACTED]",
        refreshToken: "[REDACTED]",
        safe: "visible",
      },
      items: [
        {
          apiKey: "[REDACTED]",
          value: "safe-value",
        },
      ],
    });
  });

  it("redacts bearer and JWT-shaped secret values", async () => {
    const row = await writeAuditLog({
      action: "TEST_SENSITIVE_VALUES",
      targetType: "TEST",
      metadata: {
        credential: "Bearer extremely-secret-token",
        opaqueCredential:
          "eyJhbGciOiJIUzI1NiJ9.payload.signature",
        safe: "ordinary text",
      },
    });

    const stored = await prisma.audit_log.findUnique({
      where: { id: row.id },
    });

    expect(stored).not.toBeNull();
    expect(stored?.metadata).toEqual({
      credential: "[REDACTED]",
      opaqueCredential: "[REDACTED]",
      safe: "ordinary text",
    });
  });

  it("persists the audit record fields correctly", async () => {
    const row = await writeAuditLog({
      workspaceId: null,
      actorId: null,
      action: "TEST_PERSISTENCE",
      targetType: "TEST_TARGET",
      targetId: "target-123",
      metadata: {
        reason: "security-test",
      },
    });

    const stored = await prisma.audit_log.findUnique({
      where: { id: row.id },
    });

    expect(stored).not.toBeNull();
    expect(stored?.action).toBe("TEST_PERSISTENCE");
    expect(stored?.target_type).toBe("TEST_TARGET");
    expect(stored?.target_id).toBe("target-123");
    expect(stored?.metadata).toEqual({
      reason: "security-test",
    });
    expect(stored?.created_at).toBeInstanceOf(Date);
  });

  it("never persists the raw secret values", async () => {
    const rawPassword = "raw-password-that-must-not-exist";
    const rawToken = "raw-token-that-must-not-exist";

    const row = await writeAuditLog({
      action: "TEST_NO_RAW_SECRETS",
      targetType: "TEST",
      metadata: {
        password: rawPassword,
        nested: {
          token: rawToken,
        },
      },
    });

    const stored = await prisma.audit_log.findUnique({
      where: { id: row.id },
    });

    const serialized = JSON.stringify(stored?.metadata);

    expect(serialized).not.toContain(rawPassword);
    expect(serialized).not.toContain(rawToken);
    expect(serialized).toContain("[REDACTED]");
  });
});
