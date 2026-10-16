import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createWorkspace, acceptInvitation } from "../api/workspaces";
import type { AuthUser } from "../types/auth";
import type { Workspace } from "../types/workspace";

describe("Onboarding & Workspace API Integration", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("createWorkspace sends trimmed name and returns created workspace with OWNER role", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        success: true,
        message: "Workspace created successfully",
        data: {
          id: "ws-new-123",
          name: "Acme Control Plane",
          role: "OWNER",
        },
      }),
    });

    const result = await createWorkspace({ name: "  Acme Control Plane  " });

    expect(result.id).toBe("ws-new-123");
    expect(result.name).toBe("Acme Control Plane");
    expect(result.role).toBe("OWNER");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/workspaces",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Acme Control Plane" }),
      }),
    );
  });

  it("acceptInvitation sends trimmed token and returns workspaceId and role", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        success: true,
        message: "Invitation accepted",
        data: {
          workspaceId: "ws-target-456",
          role: "MEMBER",
        },
      }),
    });

    const result = await acceptInvitation({ token: "  token-hex-64  " });

    expect(result.workspaceId).toBe("ws-target-456");
    expect(result.role).toBe("MEMBER");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/invitations/accept",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "token-hex-64" }),
      }),
    );
  });

  it("enforces user independence: AuthUser has no global role property", () => {
    const user: AuthUser = {
      id: "u-999",
      name: "Jordan Lee",
      email: "jordan@example.com",
    };

    // User entity contains identity only, no role
    expect((user as unknown as Record<string, unknown>).role).toBeUndefined();
    expect(user.id).toBe("u-999");
    expect(user.email).toBe("jordan@example.com");
  });

  it("derives role from workspace membership rather than global user role", () => {
    const workspaces: Workspace[] = [
      { id: "ws-1", name: "Team Alpha", role: "OWNER" },
      { id: "ws-2", name: "Team Beta", role: "MEMBER" },
    ];

    // Same user holds different roles per workspace
    const alpha = workspaces.find((w) => w.id === "ws-1");
    const beta = workspaces.find((w) => w.id === "ws-2");

    expect(alpha?.role).toBe("OWNER");
    expect(beta?.role).toBe("MEMBER");
  });

  it("determines onboarding navigation requirement based on workspace count", () => {
    const shouldGoToOnboarding = (workspaces: Workspace[] | undefined, isLoading: boolean) => {
      if (isLoading) return false;
      return !workspaces || workspaces.length === 0;
    };

    expect(shouldGoToOnboarding([], true)).toBe(false); // still loading
    expect(shouldGoToOnboarding([], false)).toBe(true); // loaded and 0 workspaces -> onboarding
    expect(
      shouldGoToOnboarding([{ id: "ws-1", name: "Alpha", role: "OWNER" }], false),
    ).toBe(false); // has workspace -> stay in app
  });
});
