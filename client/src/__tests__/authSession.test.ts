import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  onSessionExpired,
  refreshSessionWithDeduplication,
  setAccessToken,
  setRefreshToken,
  setSession,
  setStoredUser,
  updateSessionTokens,
} from "../lib/authSession";

describe("authSession manager", () => {
  beforeEach(() => {
    localStorage.clear();
    clearSession();
    vi.restoreAllMocks();
  });

  it("stores and retrieves access token and user from localStorage", () => {
    setAccessToken("test-access-token");
    expect(getAccessToken()).toBe("test-access-token");

    const testUser = { id: "u-1", name: "Alice", email: "alice@collabspace.dev" };
    setStoredUser(testUser);
    expect(getStoredUser()).toEqual(testUser);
  });

  it("NEVER stores refresh token in localStorage or sessionStorage", () => {
    setSession({
      accessToken: "access-123",
      refreshToken: "refresh-secret-456",
      user: { id: "u-1", name: "Alice", email: "alice@collabspace.dev" },
    });

    // Verify localStorage has access token and user, but NO refresh token
    expect(localStorage.getItem("accessToken")).toBe("access-123");
    expect(localStorage.getItem("collabspace_user")).toBeTruthy();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(sessionStorage.getItem("refreshToken")).toBeNull();

    // Verify in-memory access
    expect(getRefreshToken()).toBe("refresh-secret-456");
  });

  it("clears all storage and in-memory tokens on clearSession", () => {
    setSession({
      accessToken: "access-123",
      refreshToken: "refresh-secret-456",
      user: { id: "u-1", name: "Alice", email: "alice@collabspace.dev" },
    });

    clearSession();

    expect(getAccessToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("updates tokens on updateSessionTokens without touching user", () => {
    setSession({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      user: { id: "u-1", name: "Alice", email: "alice@collabspace.dev" },
    });

    updateSessionTokens({
      accessToken: "access-2",
      refreshToken: "refresh-2",
    });

    expect(getAccessToken()).toBe("access-2");
    expect(getRefreshToken()).toBe("refresh-2");
    expect(getStoredUser()?.name).toBe("Alice");
  });

  it("deduplicates concurrent refresh attempts into a single operation", async () => {
    setRefreshToken("initial-refresh-token");

    let callCount = 0;
    const mockRefreshFn = vi.fn(async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 50));
      return {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      };
    });

    // Launch 3 concurrent refresh calls
    const [t1, t2, t3] = await Promise.all([
      refreshSessionWithDeduplication(mockRefreshFn),
      refreshSessionWithDeduplication(mockRefreshFn),
      refreshSessionWithDeduplication(mockRefreshFn),
    ]);

    expect(callCount).toBe(1);
    expect(t1).toBe("new-access-token");
    expect(t2).toBe("new-access-token");
    expect(t3).toBe("new-access-token");
    expect(getRefreshToken()).toBe("new-refresh-token");
  });

  it("notifies listeners and clears session when refresh token is missing", async () => {
    const expiredListener = vi.fn();
    const unsub = onSessionExpired(expiredListener);

    setAccessToken("old-access-token");
    setRefreshToken(null);

    const mockRefreshFn = vi.fn();
    const res = await refreshSessionWithDeduplication(mockRefreshFn);

    expect(res).toBeNull();
    expect(mockRefreshFn).not.toHaveBeenCalled();
    expect(expiredListener).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();

    unsub();
  });
});
