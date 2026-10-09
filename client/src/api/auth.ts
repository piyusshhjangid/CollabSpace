import { apiFetch } from "../lib/api";
import type {
  AuthUser,
  BackendApiResponse,
  LoginPayload,
  LoginResult,
  RefreshResult,
  RegisterPayload,
} from "../types/auth";

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const response = await apiFetch<BackendApiResponse<AuthUser>>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name.trim(),
      email: payload.email.trim(),
      password: payload.password,
    }),
  });

  if (!response.data) {
    throw new Error(response.message || "Registration failed");
  }

  return response.data;
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const response = await apiFetch<BackendApiResponse<LoginResult>>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email.trim(),
      password: payload.password,
    }),
  });

  if (!response.data) {
    throw new Error(response.message || "Login failed");
  }

  return response.data;
}

export async function refreshSession(refreshToken: string): Promise<RefreshResult> {
  const response = await apiFetch<BackendApiResponse<RefreshResult>>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.data) {
    throw new Error(response.message || "Failed to refresh session");
  }

  return response.data;
}

export async function logout(refreshToken?: string | null): Promise<void> {
  if (refreshToken) {
    try {
      await apiFetch<BackendApiResponse<null>>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Even if network or token invalidation fails on server, client session should clear
    }
  }
}
