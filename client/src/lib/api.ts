import {
  getAccessToken,
  getRefreshToken,
  refreshSessionWithDeduplication,
  clearSession,
  notifySessionExpired,
} from "./authSession";
import type { BackendApiResponse, RefreshResult } from "../types/auth";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export class ApiError extends Error {
  public status: number;
  public data: unknown;
  public requestId?: string;

  constructor(message: string, status: number, data?: unknown, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.requestId = requestId;
  }
}

export interface ApiFetchOptions extends RequestInit {
  _isRetry?: boolean;
}

function getSanitizedErrorMessage(status: number, serverMessage?: string): string {
  if (status === 400) {
    return serverMessage || "Validation failed. Please check your submission.";
  }
  if (status === 401) {
    return serverMessage || "Authentication required. Please log in.";
  }
  if (status === 403) {
    return serverMessage || "You do not have permission to perform this action.";
  }
  if (status === 409) {
    return serverMessage || "A conflict occurred with an existing record.";
  }
  if (status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (status >= 500) {
    return "An unexpected server error occurred. Please try again later.";
  }
  return serverMessage || "An unexpected error occurred.";
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const accessToken = getAccessToken();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Unable to connect to the server. Please check your network connection.",
      0,
    );
  }

  // Handle 401 Unauthorized for authenticated endpoints
  const isAuthRoute =
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/register") ||
    path.startsWith("/auth/refresh");

  if (response.status === 401 && !options._isRetry && !isAuthRoute) {
    const hasRefreshToken = Boolean(getRefreshToken());
    if (hasRefreshToken) {
      try {
        const newAccessToken = await refreshSessionWithDeduplication(async (token) => {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: token }),
          });

          if (!refreshRes.ok) {
            throw new Error("Refresh failed");
          }

          const refreshData = (await refreshRes.json()) as BackendApiResponse<RefreshResult>;
          if (!refreshData.data) {
            throw new Error("Malformed refresh response");
          }
          return refreshData.data;
        });

        if (newAccessToken) {
          // Retry original request once with new token
          return apiFetch<T>(path, {
            ...options,
            _isRetry: true,
          });
        }
      } catch {
        clearSession();
        notifySessionExpired();
      }
    } else {
      clearSession();
      notifySessionExpired();
    }
  }

  let data: unknown = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorRecord = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
    const serverMessage = typeof errorRecord?.message === "string" ? errorRecord.message : undefined;
    const requestId = typeof errorRecord?.requestId === "string" ? errorRecord.requestId : undefined;
    const userMessage = getSanitizedErrorMessage(response.status, serverMessage);

    if (response.status === 403 && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("collabspace:forbidden", {
          detail: { message: userMessage },
        }),
      );
    }

    throw new ApiError(userMessage, response.status, data, requestId);
  }

  return data as T;
}