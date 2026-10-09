import type { AuthUser, LoginResult, RefreshResult } from "../types/auth";

const ACCESS_TOKEN_KEY = "accessToken";
const USER_KEY = "collabspace_user";

// Refresh tokens MUST NEVER be stored in localStorage or sessionStorage.
// Keep exclusively in-memory within this module.
let inMemoryRefreshToken: string | null = null;
let activeRefreshPromise: Promise<string | null> | null = null;

type SessionExpiredListener = () => void;
const sessionExpiredListeners: Set<SessionExpiredListener> = new Set();

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

export function notifySessionExpired(): void {
  for (const listener of sessionExpiredListeners) {
    try {
      listener();
    } catch {
      // Ignore listener errors
    }
  }
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // LocalStorage might be disabled
  }
}

export function getRefreshToken(): string | null {
  return inMemoryRefreshToken;
}

export function setRefreshToken(token: string | null): void {
  inMemoryRefreshToken = token;
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // LocalStorage might be disabled
  }
}

export function setSession(result: LoginResult): void {
  setAccessToken(result.accessToken);
  setRefreshToken(result.refreshToken);
  setStoredUser(result.user);
}

export function updateSessionTokens(result: RefreshResult): void {
  setAccessToken(result.accessToken);
  setRefreshToken(result.refreshToken);
}

export function clearSession(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // LocalStorage might be disabled
  }
  inMemoryRefreshToken = null;
}

/**
 * Executes a token refresh with concurrency deduplication.
 * If multiple requests fail with 401 simultaneously, they all await the exact same in-flight refresh promise.
 */
export async function refreshSessionWithDeduplication(
  refreshFn: (refreshToken: string) => Promise<RefreshResult>,
): Promise<string | null> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    clearSession();
    notifySessionExpired();
    return null;
  }

  activeRefreshPromise = (async () => {
    try {
      const result = await refreshFn(currentRefreshToken);
      updateSessionTokens(result);
      return result.accessToken;
    } catch (err) {
      clearSession();
      notifySessionExpired();
      throw err;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}
