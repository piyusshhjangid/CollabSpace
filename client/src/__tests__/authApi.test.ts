import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { register, login, refreshSession, logout } from "../api/auth";

describe("auth API functions", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("register sends trimmed payload and returns user without tokens", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        success: true,
        message: "User registered successfully",
        data: {
          id: "u-123",
          name: "Dev User",
          email: "dev@collabspace.dev",
          createdAt: "2026-10-09T00:00:00Z",
        },
      }),
    });

    const user = await register({
      name: "  Dev User  ",
      email: "  dev@collabspace.dev  ",
      password: "password123",
    });

    expect(user.id).toBe("u-123");
    expect(user.name).toBe("Dev User");
    expect(user.email).toBe("dev@collabspace.dev");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Dev User",
          email: "dev@collabspace.dev",
          password: "password123",
        }),
      }),
    );
  });

  it("login sends trimmed payload and returns access token, refresh token, and user", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        success: true,
        message: "Login successful",
        data: {
          accessToken: "jwt-access-token",
          refreshToken: "hex-refresh-token",
          user: {
            id: "u-123",
            name: "Dev User",
            email: "dev@collabspace.dev",
          },
        },
      }),
    });

    const result = await login({
      email: "  dev@collabspace.dev  ",
      password: "password123",
    });

    expect(result.accessToken).toBe("jwt-access-token");
    expect(result.refreshToken).toBe("hex-refresh-token");
    expect(result.user.name).toBe("Dev User");
  });

  it("refreshSession sends refreshToken and returns new tokens", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        success: true,
        message: "Access token refreshed",
        data: {
          accessToken: "next-access-token",
          refreshToken: "next-refresh-token",
        },
      }),
    });

    const result = await refreshSession("current-token");

    expect(result.accessToken).toBe("next-access-token");
    expect(result.refreshToken).toBe("next-refresh-token");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/auth/refresh",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "current-token" }),
      }),
    );
  });

  it("logout sends refreshToken to backend", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        success: true,
        message: "Logged out successfully",
        data: null,
      }),
    });

    await logout("token-to-revoke");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/auth/logout",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "token-to-revoke" }),
      }),
    );
  });
});
