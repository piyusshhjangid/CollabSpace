import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { apiFetch, ApiError } from "../lib/api";
import {
  clearSession,
  setAccessToken,
  setRefreshToken,
  getAccessToken,
} from "../lib/authSession";

describe("apiFetch client and interceptor", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    clearSession();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("attaches Authorization header when accessToken exists", async () => {
    setAccessToken("my-access-token");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: true, data: { value: 42 } }),
    });

    const res = await apiFetch<{ success: boolean; data: { value: number } }>("/api/test");

    expect(res.data.value).toBe(42);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer my-access-token",
        }),
      }),
    );
  });

  it("handles 400 validation error cleanly with server message", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ message: "Email is already registered" }),
    });

    await expect(apiFetch("/auth/register")).rejects.toThrowError(ApiError);
    await expect(apiFetch("/auth/register")).rejects.toMatchObject({
      status: 400,
      message: "Email is already registered",
    });
  });

  it("sanitizes 500 internal server error without displaying raw server details", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ message: "Database connection failed at pgPool.connect line 42" }),
    });

    await expect(apiFetch("/api/projects")).rejects.toMatchObject({
      status: 500,
      message: "An unexpected server error occurred. Please try again later.",
    });
  });

  it("automatically refreshes access token and retries on 401 when refresh token is available", async () => {
    setAccessToken("expired-token");
    setRefreshToken("valid-refresh-token");

    let attempt = 0;
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/auth/refresh")) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({
            success: true,
            data: {
              accessToken: "brand-new-token",
              refreshToken: "rotated-refresh-token",
            },
          }),
        };
      }

      attempt++;
      if (attempt === 1) {
        return {
          ok: false,
          status: 401,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ message: "Invalid or expired token" }),
        };
      }

      return {
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true, data: "secured data" }),
      };
    });

    const result = await apiFetch<{ data: string }>("/api/workspaces");

    expect(result.data).toBe("secured data");
    expect(getAccessToken()).toBe("brand-new-token");
    expect(attempt).toBe(2);
  });

  it("prevents infinite loops when retried request also returns 401", async () => {
    setAccessToken("bad-token");
    setRefreshToken("fake-refresh");

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/auth/refresh")) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({
            success: true,
            data: { accessToken: "new-token", refreshToken: "new-refresh" },
          }),
        };
      }
      return {
        ok: false,
        status: 401,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ message: "Invalid or expired token" }),
      };
    });

    await expect(apiFetch("/api/workspaces")).rejects.toThrowError(ApiError);
  });

  it("dispatches collabspace:forbidden on HTTP 403", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ message: "Missing permission" }),
    });

    await expect(apiFetch("/api/projects")).rejects.toThrow();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "collabspace:forbidden",
      }),
    );
  });
});
