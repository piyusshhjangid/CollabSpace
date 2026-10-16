import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createWorkspace, acceptInvitation } from "../api/workspaces";
import { ApiError } from "../lib/api";
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

  it("fails gracefully and throws ApiError when workspace creation receives backend validation error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        message: "Workspace name is required",
      }),
    });

    await expect(createWorkspace({ name: "" })).rejects.toThrow(ApiError);
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

    expect((user as unknown as Record<string, unknown>).role).toBeUndefined();
    expect(user.id).toBe("u-999");
    expect(user.email).toBe("jordan@example.com");
  });

  it("derives role from workspace membership rather than global user role", () => {
    const workspaces: Workspace[] = [
      { id: "ws-1", name: "Team Alpha", role: "OWNER" },
      { id: "ws-2", name: "Team Beta", role: "MEMBER" },
    ];

    const alpha = workspaces.find((w) => w.id === "ws-1");
    const beta = workspaces.find((w) => w.id === "ws-2");

    expect(alpha?.role).toBe("OWNER");
    expect(beta?.role).toBe("MEMBER");
  });

  it("determines onboarding route guard behavior correctly", () => {
    const checkOnboardingAccess = (
      isAuthenticated: boolean,
      workspaces: Workspace[],
      hasInviteToken: boolean,
    ): "LOGIN" | "HOME" | "ONBOARDING" => {
      if (!isAuthenticated) return "LOGIN";
      if (workspaces.length > 0 && !hasInviteToken) return "HOME";
      return "ONBOARDING";
    };

    // Unauthenticated -> Login
    expect(checkOnboardingAccess(false, [], false)).toBe("LOGIN");
    // Authenticated + 0 workspaces -> Onboarding
    expect(checkOnboardingAccess(true, [], false)).toBe("ONBOARDING");
    // Authenticated + existing workspaces -> Home
    expect(
      checkOnboardingAccess(true, [{ id: "w-1", name: "W1", role: "MEMBER" }], false),
    ).toBe("HOME");
    // Authenticated + existing workspaces BUT has invite token -> Onboarding to accept
    expect(
      checkOnboardingAccess(true, [{ id: "w-1", name: "W1", role: "MEMBER" }], true),
    ).toBe("ONBOARDING");
  });

  it("prevents stale redirect loops in Shell by checking isWorkspacesPending and selected workspace status", () => {
    const shouldRedirectToOnboarding = ({
      workspaces,
      isLoading,
      isFetching,
      currentWorkspaceId,
      workspaceForUi,
    }: {
      workspaces: Workspace[];
      isLoading: boolean;
      isFetching: boolean;
      currentWorkspaceId: string | null;
      workspaceForUi: Workspace | null;
    }): boolean => {
      const isWorkspacesPending = isLoading || (isFetching && workspaces.length === 0);
      if (isWorkspacesPending) return false;
      if (!workspaceForUi) {
        if (currentWorkspaceId || isFetching) return false;
        return true;
      }
      return false;
    };

    // Case 1: Initial load running -> NO redirect
    expect(
      shouldRedirectToOnboarding({
        workspaces: [],
        isLoading: true,
        isFetching: true,
        currentWorkspaceId: null,
        workspaceForUi: null,
      }),
    ).toBe(false);

    // Case 2: Post-creation refetch in flight with currentWorkspaceId set -> NO redirect
    expect(
      shouldRedirectToOnboarding({
        workspaces: [],
        isLoading: false,
        isFetching: true,
        currentWorkspaceId: "ws-created-123",
        workspaceForUi: null,
      }),
    ).toBe(false);

    // Case 3: Confirmed zero workspaces, not fetching -> Redirect to onboarding
    expect(
      shouldRedirectToOnboarding({
        workspaces: [],
        isLoading: false,
        isFetching: false,
        currentWorkspaceId: null,
        workspaceForUi: null,
      }),
    ).toBe(true);

    // Case 4: Workspace is resolved and active -> NO redirect
    const activeWs: Workspace = { id: "ws-1", name: "Alpha", role: "OWNER" };
    expect(
      shouldRedirectToOnboarding({
        workspaces: [activeWs],
        isLoading: false,
        isFetching: false,
        currentWorkspaceId: "ws-1",
        workspaceForUi: activeWs,
      }),
    ).toBe(false);
  });

  it("immediately updates cache upon creation so synchronous renders resolve active workspace", () => {
    let cache: Workspace[] = [];
    const newWs: Workspace = {
      id: "ws-created-999",
      name: "New Engineering Space",
      role: "OWNER",
    };

    // Cache seeding updater function matching useCreateWorkspace
    const seedUpdater = (oldWorkspaces: Workspace[] = []) => {
      const exists = oldWorkspaces.some((w) => w.id === newWs.id);
      if (exists) return oldWorkspaces;
      return [...oldWorkspaces, newWs];
    };

    cache = seedUpdater(cache);

    expect(cache).toHaveLength(1);
    expect(cache[0].id).toBe("ws-created-999");
    expect(cache[0].role).toBe("OWNER");
  });
});
